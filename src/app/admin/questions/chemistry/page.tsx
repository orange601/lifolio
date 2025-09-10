// scripts/build-element-questions.ts
/**
 * 목적: 한국어 위키백과 "원소 목록" 표를 파싱해
 *       "기호 → 한글 원소명" 객관식 퀴즈(4지선다)로 변환하고 DB에 저장
 *
 * 실행:
 *   - 미리보기(JSON 출력) : npx tsx scripts/build-element-questions.ts
 *   - DB 저장              : SAVE_TO_DB=1 npx tsx scripts/build-element-questions.ts --save
 *   - 중복시 교체         : SAVE_TO_DB=1 npx tsx scripts/build-element-questions.ts --save --replace
 *
 * 참고: 위키백과는 CC BY-SA 라이선스이므로 출처 표기가 필요합니다.
 */

import * as cheerio from "cheerio";
// 프로젝트 경로 기준 import (필요에 맞게 경로 조정)
import { saveGeneratedQuestions } from "@/core/repositroy/questions/question.create.repo";

// =============== 설정 ===============
const WIKI_URL = "https://ko.wikipedia.org/wiki/%EC%9B%90%EC%86%8C_%EB%AA%A9%EB%A1%9D";
const CATEGORY_ID = 7;                 // ← 고정값 요청 주신 그대로
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const STATUS: "published" = "published";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

// 보기 빌드 시, 한글명만 보여줄지 여부 (기본: 한글명만)
const SHOW_KOREAN_ONLY = true;

// =============== 타입 ===============
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

type ElementRow = {
    atomic: number;       // 원자번호
    symbol: string;       // 기호 (e.g., H, He)
    nameKo: string;       // 한글명 (e.g., 수소, 헬륨)
};

// =============== 유틸 ===============
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function sampleN<T>(arr: T[], n: number): T[] {
    if (n <= 0) return [];
    if (arr.length <= n) return shuffle(arr).slice(0, n);
    const picked: T[] = [];
    const used = new Set<number>();
    while (picked.length < n && used.size < arr.length) {
        const i = Math.floor(Math.random() * arr.length);
        if (!used.has(i)) {
            used.add(i);
            picked.push(arr[i]);
        }
    }
    return picked;
}

function stemForSymbol(symbol: string) {
    return `원소 기호 '${symbol}'는 무엇일까요?`;
}
function expForSymbol(symbol: string, nameKo: string) {
    return `'${symbol}'의 한글 원소명은 ${nameKo}입니다.`;
}

function buildChoices(correct: string, wrongs: string[]): ChoiceOut[] {
    const mixed = shuffle([
        { content: correct, is_correct: true },
        ...wrongs.map((w) => ({ content: w, is_correct: false })),
    ]);
    return mixed.map((c, idx) => ({
        content: c.content,
        is_correct: c.is_correct,
        order_no: (idx + 1) as 1 | 2 | 3 | 4,
    }));
}

function toQuestion(e: ElementRow, distractors: string[]): QuestionOut {
    const stem = stemForSymbol(e.symbol);
    const explanation = expForSymbol(e.symbol, e.nameKo);
    const choices = buildChoices(e.nameKo, distractors);

    return {
        question: {
            category_id: CATEGORY_ID,
            type: "MCQ",
            stem,
            explanation,
            difficulty: DIFFICULTY_DEFAULT,
            grade: GRADE_DEFAULT,
            language: LANGUAGE,
            status: STATUS,
        },
        choices,
    };
}

// =============== 파서 ===============
/**
 * 위키 표 구조(2025-09-05 기준):
 * - 본문에 "화학 원소 목록 정렬 Z, 기호, 원소 이름..."이 있는 큰 표
 * - 각 행의 첫 3~4개 열에 원자번호, 기호, 한글 원소명이 포함됨
 * 변경 가능성이 있으므로, '숫자(원자번호) + 기호(영문 1~2자) + 한글명' 패턴으로 탐색
 */
async function fetchElementsKo(): Promise<ElementRow[]> {
    const res = await fetch(WIKI_URL, { method: "GET" });
    if (!res.ok) throw new Error(`위키백과 호출 실패: ${res.status} ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // 가장 큰 목록 테이블을 선택(헤더에 '기호'와 '원소 이름'이 포함된 테이블)
    const tables = $("table.wikitable");
    let target: cheerio.Cheerio | null = null;

    tables.each((_, t) => {
        const thText = $(t).find("th").text();
        if (thText.includes("기호") && thText.includes("원소") && thText.includes("이름")) {
            target = $(t);
            return false; // break
        }
    });

    if (!target) {
        // 폴백: 첫 번째 위키테이블
        target = tables.first();
    }

    const out: ElementRow[] = [];
    target!.find("tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length < 3) return;

        // 관찰상: 0=원자번호, 1=기호, 2=한글명 (페이지 변동 시 보정 필요)
        const atomicStr = $(tds.get(0)).text().trim();
        const symbol = $(tds.get(1)).text().trim().replace(/\s+/g, "");
        const nameKo = $(tds.get(2)).text().trim().replace(/\s+/g, "");

        const atomic = Number(atomicStr);
        const symbolOK = /^[A-Z][a-z]?$/.test(symbol); // H, He, Li 등
        const nameKoOK = !!nameKo && /[가-힣]/.test(nameKo);

        if (!Number.isFinite(atomic) || !symbolOK || !nameKoOK) return;

        out.push({ atomic, symbol, nameKo });
    });

    // 원자번호 기준 오름차순
    out.sort((a, b) => a.atomic - b.atomic);
    return out;
}

// =============== 메인 ===============
async function main() {
    const elements = await fetchElementsKo();

    // 보기용 후보 풀(한글명 리스트)
    const namePool = elements.map((e) => e.nameKo);

    const questions: QuestionOut[] = [];
    for (const e of elements) {
        const wrongs = sampleN(
            namePool.filter((n) => n !== e.nameKo),
            3
        );
        if (wrongs.length < 3) continue;

        questions.push(toQuestion(e, wrongs));
        if (questions.length >= MAX_QUESTIONS) break;
    }

    // 저장 여부
    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" = process.argv.includes("--replace") ? "replace" : "skip";

    if (true) {
        // const res = await saveGeneratedQuestions(questions as any, {
        //     onDuplicate,
        //     validate: true,
        // });
        //console.log(JSON.stringify(res, null, 2));
    } else {
        //console.log(JSON.stringify(questions.slice(0, 5), null, 2)); // 미리보기 5문항
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

export default function QuizEditPageDemo() {
    return <>화학</>;
}