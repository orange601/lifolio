// scripts/build-idiom-meaning-to-reading.ts
/**
 * 사용법:
 *   # 미리보기(JSON 5개)
 *   $ tsx scripts/build-idiom-meaning-to-reading.ts
 *
 *   # DB 저장 (중복 skip)
 *   $ SAVE_TO_DB=1 tsx scripts/build-idiom-meaning-to-reading.ts --save
 *
 *   # DB 저장 (중복 교체)
 *   $ SAVE_TO_DB=1 tsx scripts/build-idiom-meaning-to-reading.ts --save --replace
 *
 * 문제 형식: stem = 의미해석, 정답 = 한국어 발음
 * 출처: 위키인용집 '한문 성어' (CC BY-SA 4.0)
 */

import * as cheerio from "cheerio";
import { saveGeneratedQuestions } from "@/core/repositroy/questions/question.create.repo";

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

type IdiomItem = {
    hanja: string;
    reading: string;  // 한국어 발음
    meaning: string;  // 의미해석
};

const SOURCE_URL = "https://ko.wikiquote.org/wiki/%ED%95%9C%EB%AC%B8_%EC%84%B1%EC%96%B4";
const CATEGORY_ID = 12;
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

const zap = (s: string) =>
    String(s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

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
        if (!used.has(i)) { used.add(i); picked.push(pool[i]); }
    }
    return picked;
}

/** 한글 초성 추출(오답 유사도 향상용) */
function initialConsonant(ch: string): string | null {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    const idx = Math.floor((code - 0xac00) / 588);
    return initials[idx] ?? null;
}

/** 페이지 → IdiomItem[] */
async function fetchIdiomList(): Promise<IdiomItem[]> {
    const res = await fetch(SOURCE_URL, { method: "GET" });
    if (!res.ok) throw new Error(`페이지 가져오기 실패: ${res.status} ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const $root = $("#mw-content-text .mw-parser-output");
    if (!$root.length) throw new Error("본문 컨테이너를 찾지 못했습니다.");

    const out: IdiomItem[] = [];

    $root.find("table").each((_, table) => {
        $(table).find("tr").each((__, tr) => {
            const tds = $(tr).find("td");
            if (tds.length < 3) return;

            const hanja = zap($(tds[0]).text());
            const reading = zap($(tds[1]).text());
            const meaning = zap($(tds[2]).text());

            if (hanja && reading && meaning && reading.length >= 2 && meaning.length >= 2) {
                out.push({ hanja, reading, meaning });
            }
        });
    });

    const seen = new Set<string>();
    return out.filter((it) => {
        const key = `${it.reading}::${it.meaning}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** 보기 4개 생성 */
function buildChoices(correct: string, wrongs: string[]): ChoiceOut[] {
    const four = shuffle([{ content: correct, is_correct: true }, ...wrongs.map(w => ({ content: w, is_correct: false }))]);
    return four.map((c, i) => ({ content: c.content, is_correct: c.is_correct, order_no: (i + 1) as 1 | 2 | 3 | 4 }));
}

/** 발음 오답 3개(초성 유사도 활용) */
function pickReadingDistractors(correct: string, allReadings: string[]): string[] {
    const exclude = new Set([correct]);
    const ini = initialConsonant(correct[0] ?? "");
    const sameIni = allReadings.filter(r => !exclude.has(r) && initialConsonant(r[0] ?? "") === ini);
    let picked = sampleN(sameIni, Math.min(3, sameIni.length));
    if (picked.length < 3) {
        const remain = allReadings.filter(r => !exclude.has(r) && !picked.includes(r));
        picked = [...picked, ...sampleN(remain, 3 - picked.length)];
    }
    return picked.slice(0, 3);
}

/** 문제=의미, 정답=발음 */
function buildQuestion(it: IdiomItem, all: IdiomItem[]): QuestionOut {
    const stem = `다음 의미해석에 해당하는 한국어 발음은 무엇인가요?\n\n"${it.meaning}"`;
    const wrongs = pickReadingDistractors(it.reading, all.map(x => x.reading));
    const choices = buildChoices(it.reading, wrongs);
    const explanation =
        `정답: ${it.reading}\n\n추가: 성어는 "${it.hanja}"이며, 의미는 "${it.meaning}"입니다.\n\n출처: 위키인용집 ‘한문 성어’ (CC BY-SA 4.0)`;
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

    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" =
        process.argv.includes("--replace") ? "replace" : "skip";

    //const res = await saveGeneratedQuestions(out as any, { onDuplicate, validate: true });
    //console.log(JSON.stringify(res, null, 2));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
