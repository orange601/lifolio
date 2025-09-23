// scripts/build-hanja-questions.ts
/**
 * 사용법:
 *   # 콘솔 출력만
 *   $ tsx scripts/build-hanja-questions.ts
 *
 *   # DB 저장 (중복 skip)
 *   $ SAVE_TO_DB=1 tsx scripts/build-hanja-questions.ts --save
 *
 *   # DB 저장 (중복 교체)
 *   $ SAVE_TO_DB=1 tsx scripts/build-hanja-questions.ts --save --replace
 *
 *   # 모드 선택
 *   $ tsx scripts/build-hanja-questions.ts --mode=meaning    # 뜻→한자 (기본)
 *   $ tsx scripts/build-hanja-questions.ts --mode=reading    # 한자→음 읽기
 *
 * 출처: 위키낱말사전 ‘부록: 한문 교육용 기초 한자 1800’ (CC BY-SA 4.0)
 */

import * as cheerio from "cheerio";
import { saveGeneratedQuestions } from "@/core/repositroy/questions/question.create.repo";

// ===== 타입 =====
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

type HanjaItem = {
    hanja: string;   // 家
    reading: string; // 가
    meaning: string; // 집 / 아름다울 ...
};

// ===== 설정 =====
const SOURCE_URL =
    "https://ko.wiktionary.org/wiki/%EB%B6%80%EB%A1%9D:%ED%95%9C%EB%AC%B8_%EA%B5%90%EC%9C%A1%EC%9A%A9_%EA%B8%B0%EC%B4%88_%ED%95%9C%EC%9E%90_1800";

const CATEGORY_ID = 12; // 모든 문제 공통 카테고리
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

const MODE: "meaning" | "reading" =
    ((process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] as any) || "meaning");

// ===== 유틸 =====
const zap = (s: string) =>
    String(s || "")
        .replace(/\[[^\]]*\]/g, "")      // [주석] 제거
        .replace(/[()（）]/g, " ")       // 괄호 제거
        .replace(/\s+/g, " ")
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

/** 한글 초성 */
function initialConsonant(ch: string): string | null {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    const initials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    const idx = Math.floor((code - 0xac00) / 588);
    return initials[idx] ?? null;
}

const CJK_RE = /^[\u3400-\u9FFF\uF900-\uFAFF]$/;

// ===== 파서: 표 기반 =====
async function fetchHanjaList(): Promise<HanjaItem[]> {
    const res = await fetch(SOURCE_URL, { method: "GET" });
    if (!res.ok) throw new Error(`페이지 가져오기 실패: ${res.status} ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const $root = $("#mw-content-text .mw-parser-output");
    if ($root.length === 0) throw new Error("본문 컨테이너를 찾지 못했습니다.");

    const items: HanjaItem[] = [];

    // 각 자모 섹션의 표들
    $root.find("table.datatable").each((_, table) => {
        // 표의 데이터 행들: 보통 th(가/각/…) + 2개의 td(중/고교 목록)
        $(table)
            .find("tbody > tr")
            .each((__, tr) => {
                const $tr = $(tr);
                // 데이터행만: th가 있고 뒤에 td가 있는 행
                if ($tr.find("th").length === 0) return;

                // 두 칸(중/고) 모두 파싱
                $tr.find("td").each((___, td) => {
                    const $td = $(td);

                    // 셀 안을 앞에서부터 훑어 a(한자) → small(뜻/읽기) 페어 추출
                    $td.contents().each((i, node) => {
                        if (node.type !== "tag") return;
                        if (node.name !== "a") return;

                        const $a = $(node);
                        const hanja = $a.text().trim();

                        if (!CJK_RE.test(hanja)) return; // 한 글자 한자만

                        // 이어지는 small 하나를 잡는다 (중간에 공백/구분점 span 등이 있어도 nextAll로 해결)
                        const $small = $a.nextAll("small").first();
                        if ($small.length === 0) return;

                        // small 텍스트: "(집 가)" / "(아름다울 가)" 등
                        const inner = zap($small.text()); // 괄호 제거되었음 → "집 가" / "아름다울 가"
                        if (!inner) return;

                        const parts = inner.split(" ");
                        const reading = parts[parts.length - 1]; // 맨 끝 토큰 (가/각/강…)
                        const meaning = zap(parts.slice(0, -1).join(" "));

                        if (!reading || !meaning) return;

                        items.push({ hanja, reading, meaning });
                    });
                });
            });
    });

    // 중복 제거(한자+읽기 기준)
    const seen = new Set<string>();
    const uniq = items.filter((it) => {
        const key = `${it.hanja}::${it.reading}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // 최소 품질 필터
    return uniq.filter((x) => x.hanja.length === 1 && x.reading.length >= 1 && x.meaning.length >= 1);
}

// ===== 문제 빌더 =====
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

/** 오답: 읽기(한글) 초성 우선 → 부족분 보충 */
function pickDistractorsByReading(correct: string, all: string[]): string[] {
    const exclude = new Set([correct]);
    const ini = initialConsonant(correct[0] ?? "");
    const sameIni = all.filter((r) => !exclude.has(r) && initialConsonant(r[0] ?? "") === ini);
    let picked = sampleN(sameIni, Math.min(3, sameIni.length));
    if (picked.length < 3) {
        const remain = all.filter((r) => !exclude.has(r) && !picked.includes(r));
        picked = [...picked, ...sampleN(remain, 3 - picked.length)];
    }
    return picked.slice(0, 3);
}

/** 오답: 한자 풀에서 무작위 */
function pickDistractorsByHanja(correct: string, all: string[]): string[] {
    const picked = sampleN(all, 3, new Set([correct]));
    if (picked.length < 3) throw new Error("오답 부족");
    return picked;
}

// 뜻 → 한자
function buildQuestionMeaning(item: HanjaItem, all: HanjaItem[]): QuestionOut {
    const stem = `다음 뜻에 맞는 한자는 무엇인가요?\n\n"${item.meaning}"`;
    const wrongs = pickDistractorsByHanja(item.hanja, all.map((x) => x.hanja));
    const choices = buildChoices(item.hanja, wrongs);
    const explanation =
        `정답: ${item.hanja} (${item.meaning} ${item.reading})\n\n` +
        `풀이: "${item.meaning}"의 한자는 ${item.hanja}이고 읽기는 "${item.reading}"입니다.\n\n` +
        `출처: 위키낱말사전 ‘부록: 한문 교육용 기초 한자 1800’ (CC BY-SA 4.0)`;

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

// 한자 → 읽기
function buildQuestionReading(item: HanjaItem, all: HanjaItem[]): QuestionOut {
    const stem = `다음 한자의 올바른 읽기는 무엇인가요?\n\n${item.hanja}`;
    const wrongs = pickDistractorsByReading(item.reading, all.map((x) => x.reading));
    const choices = buildChoices(item.reading, wrongs);
    const explanation =
        `정답: ${item.reading}\n\n` +
        `풀이: ${item.hanja}의 뜻은 "${item.meaning}"이고 읽기는 "${item.reading}"입니다.\n\n` +
        `출처: 위키낱말사전 ‘부록: 한문 교육용 기초 한자 1800’ (CC BY-SA 4.0)`;

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

// ===== 메인 =====
async function main() {
    const list = await fetchHanjaList();
    if (!list.length) {
        throw new Error("파싱 결과가 0건입니다. 페이지 구조가 바뀌었는지 확인하세요.");
    }

    const out: QuestionOut[] = [];
    for (const it of list) {
        try {
            const q = MODE === "reading"
                ? buildQuestionReading(it, list)
                : buildQuestionMeaning(it, list);
            out.push(q);
            if (out.length >= MAX_QUESTIONS) break;
        } catch {
            continue;
        }
    }

    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" =
        process.argv.includes("--replace") ? "replace" : "skip";

    if (shouldSave) {
        const res = await saveGeneratedQuestions(out as any, {
            onDuplicate,
            validate: true,
        });
        console.log(JSON.stringify(res, null, 2));
    } else {
        console.log(JSON.stringify(out, null, 2));
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
