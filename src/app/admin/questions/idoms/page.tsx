// scripts/build-idiom-questions.ts
/**
 * 사용법:
 *   # 미리보기(JSON 5개)
 *   $ tsx scripts/build-idiom-questions.ts
 *
 *   # DB 저장 (중복 skip)
 *   $ SAVE_TO_DB=1 tsx scripts/build-idiom-questions.ts --save
 *
 *   # DB 저장 (중복 교체)
 *   $ SAVE_TO_DB=1 tsx scripts/build-idiom-questions.ts --save --replace
 *
 * 문제 형식: stem = 한국어 발음, 보기/정답 = 의미해석
 * 출처: 위키인용집 '한문 성어' (CC BY-SA 4.0)
 */

import * as cheerio from "cheerio";
import { saveGeneratedQuestions } from "@/core/repositroy/questions/questions.create.repo";

type ChoiceOut = { content: string; is_correct: boolean; order_no: 1 | 2 | 3 | 4 };
type QuestionOut = {
    question: {
        category_id: number;
        type: "MCQ";
        stem: string;
        explanation: string;
        difficulty: number;
        grade: string;
        language: "ko";
        status: "published";
    };
    choices: ChoiceOut[];
};

// 한 줄(행) 단위 파싱 결과
type IdiomItem = {
    hanja: string;      // 苛斂誅求
    reading: string;    // 가렴주구   ← 이게 문제에 제시될 텍스트
    meaning: string;    // 가혹하게 착취하여 매우 재촉함. ← 이게 정답
};

const SOURCE_URL = "https://ko.wikiquote.org/wiki/%ED%95%9C%EB%AC%B8_%EC%84%B1%EC%96%B4";
const CATEGORY_ID = Number(process.env.CATEGORY_ID ?? 12); // 필요시 환경변수로 바꿔 사용
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

const zap = (s: string) =>
    String(s || "")
        .replace(/\s+/g, " ")
        .replace(/\u00a0/g, " ")
        .trim();

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function sampleN<T>(arr: T[], n: number, exclude: Set<T> = new Set()): T[] {
    const pool = arr.filter((x) => !exclude.has(x));
    if (pool.length <= n) return shuffle(pool).slice(0, n);
    const picked: T[] = [];
    const used = new Set<number>();
    while (picked.length < n && used.size < pool.length) {
        const i = Math.floor(Math.random() * pool.length);
        if (!used.has(i)) {
            used.add(i);
            picked.push(pool[i]);
        }
    }
    return picked;
}

/** 페이지 → IdiomItem[] (표 기반) */
async function fetchIdiomList(): Promise<IdiomItem[]> {
    const res = await fetch(SOURCE_URL, { method: "GET" });
    if (!res.ok) throw new Error(`페이지 가져오기 실패: ${res.status} ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const $root = $("#mw-content-text .mw-parser-output");
    if (!$root.length) throw new Error("본문 컨테이너를 찾지 못했습니다.");

    const out: IdiomItem[] = [];

    // 표는 보통 thead에 "성어 | 한국어 발음 | 의미해석" 헤더가 있고, tbody에 데이터 행이 이어짐
    $root.find("table").each((_, table) => {
        const headers = $(table).find("thead th").map((__, th) => zap($(th).text())).get();
        // 헤더가 없더라도 첫 행이 헤더일 수 있으므로, 유연하게 td 3칸짜리 행을 탐색
        $(table)
            .find("tr")
            .each((__, tr) => {
                const tds = $(tr).find("td");
                if (tds.length < 3) return;

                const hanja = zap($(tds[0]).text());
                const reading = zap($(tds[1]).text());
                const meaning = zap($(tds[2]).text());

                // 최소 검증: 한자 2~6자, 한국어 발음 2자 이상, 의미 2자 이상
                if (hanja && reading && meaning && reading.length >= 2 && meaning.length >= 2) {
                    out.push({ hanja, reading, meaning });
                }
            });
    });

    // 중복 제거 (reading+meaning 기준)
    const seen = new Set<string>();
    return out.filter((it) => {
        const key = `${it.reading}::${it.meaning}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** 보기 4개(정답 1 + 오답 3), order_no 1..4 랜덤 */
function buildChoices(correct: string, wrongs: string[]): ChoiceOut[] {
    const four = shuffle([
        { content: correct, is_correct: true },
        ...wrongs.map((w) => ({ content: w, is_correct: false })),
    ]);
    return four.map((c, idx) => ({
        content: c.content,
        is_correct: c.is_correct,
        order_no: (idx + 1) as 1 | 2 | 3 | 4,
    }));
}

/** 오답: 의미해석 풀에서 무작위 3개 */
function pickMeaningDistractors(correct: string, allMeanings: string[]): string[] {
    const exclude = new Set([correct]);
    const picked = sampleN(allMeanings, 3, exclude);
    if (picked.length < 3) throw new Error("오답 부족");
    return picked;
}

/** 한 항목 → MCQ 1건 (문제=한국어 발음, 정답=의미해석) */
function buildQuestion(item: IdiomItem, all: IdiomItem[]): QuestionOut {
    const stem = `다음 한국어 발음에 해당하는 의미해석은 무엇인가요?\n\n${item.reading}`;
    const wrongs = pickMeaningDistractors(item.meaning, all.map((x) => x.meaning));
    const choices = buildChoices(item.meaning, wrongs);
    const explanation =
        `정답: ${item.meaning}\n\n` +
        `추가: 성어는 "${item.hanja}"( ${item.reading} ) 입니다.\n\n` +
        `출처: 위키인용집 ‘한문 성어’ (CC BY-SA 4.0)`;

    return {
        question: {
            category_id: CATEGORY_ID,
            type: "MCQ",
            stem,
            explanation,
            difficulty: DIFFICULTY_DEFAULT,
            grade: GRADE_DEFAULT,
            language: LANGUAGE,
            status: "published",
        },
        choices,
    };
}

async function main() {
    const items = await fetchIdiomList();
    if (!items.length) {
        console.error("❌ 파싱 결과가 0건입니다. 표 구조가 바뀌었는지 확인하세요.");
        return;
    }

    const out: QuestionOut[] = [];
    for (const it of items) {
        try {
            out.push(buildQuestion(it, items));
            if (out.length >= MAX_QUESTIONS) break;
        } catch { }
    }

    console.log("######################################")

    //const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    //const onDuplicate: "skip" | "replace" =
    //    process.argv.includes("--replace") ? "replace" : "skip";
    //
    //const res = await saveGeneratedQuestions(out as any, { onDuplicate, validate: true });
    //console.log(JSON.stringify(res, null, 2));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
