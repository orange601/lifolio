// scripts/build-capital-questions.ts
/**
 * 사용법: 페이지 접속하면 자동 실행됨
 * 
 * ----------------------- 여기 주석 풀어 위치에 주석풀면됨
 */

import { saveGeneratedQuestions } from "@/core/repositroy/questions/questions.create.repo";

// Node 18+ 전역 fetch 사용 (구버전이면 node-fetch 사용)

type RCTranslations = {
    kor?: { official?: string; common?: string };
    [k: string]: { official?: string; common?: string } | undefined;
};

type RCCountry = {
    name: { common: string };
    capital?: string[]; // 수도 복수 가능
    region?: string;
    cca2?: string;
    cca3?: string;
    translations?: RCTranslations;
};

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

// -------------------- 설정 --------------------
const API_URL =
    "https://restcountries.com/v3.1/all?fields=name,capital,region,cca2,cca3,translations";
const CATEGORY_ID = 3;              // 수도 카테고리
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

// -------------------- 유틸 --------------------
function pickFirstCapital(capitals?: string[]): string | null {
    if (!capitals || capitals.length === 0) return null;
    const first = String(capitals[0] ?? "").trim();
    return first ? first : null;
}
function countryNameKoOrEn(c: RCCountry): string {
    const ko = c.translations?.kor?.common?.trim();
    return ko && ko.length > 0 ? ko : c.name.common;
}
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

// -------------------- 핵심 로직 --------------------
function buildStem(countryKo: string) {
    return `${countryKo}의 수도는 어디인가요?`;
}
function buildExplanation(countryKo: string, capital: string) {
    return `${countryKo}의 수도는 ${capital}입니다.`;
}

/** 오답 3개: 같은 region 우선, 부족하면 전체에서 보충 */
function pickDistractors(
    correctCapital: string,
    region: string | undefined,
    capitalsByRegion: Map<string, string[]>,
    allCapitals: string[],
): string[] {
    const cleanedCorrect = correctCapital.trim();
    const regionPool = (region ? capitalsByRegion.get(region) ?? [] : []).filter(
        (cap) => cap && cap !== cleanedCorrect
    );

    const need = 3;
    let wrongs = sampleN(regionPool, Math.min(need, regionPool.length));

    if (wrongs.length < need) {
        const remaining = allCapitals.filter(
            (cap) => cap && cap !== cleanedCorrect && !wrongs.includes(cap)
        );
        const extra = sampleN(remaining, need - wrongs.length);
        wrongs = [...wrongs, ...extra];
    }

    if (wrongs.length < 3) {
        throw new Error(`오답이 3개 미만입니다. correct=${correctCapital}, region=${region}`);
    }
    return wrongs.slice(0, 3);
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

/** 국가 1건 → QuestionOut 1건 */
function buildQuestionForCountry(
    c: RCCountry,
    correctCapital: string,
    distractors: string[],
): QuestionOut {
    const countryKo = countryNameKoOrEn(c);
    const stem = buildStem(countryKo);
    const explanation = buildExplanation(countryKo, correctCapital);
    const choices = buildChoices(correctCapital, distractors);

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

// -------------------- 메인 --------------------
async function main() {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) {
        throw new Error(`REST Countries 호출 실패: ${res.status} ${res.statusText}`);
    }
    const data: RCCountry[] = await res.json();

    // 유효한 수도 보유 국가만 필터링
    const valid = data
        .map((c) => ({
            ...c,
            _capital: pickFirstCapital(c.capital),
            _region: c.region ?? "Unknown",
        }))
        .filter((c) => !!c._capital && (c._capital as string).trim().length > 0);

    // region → capitals 인덱스 & 전체 수도 풀
    const capitalsByRegion = new Map<string, string[]>();
    for (const c of valid) {
        const reg = c._region as string;
        const cap = c._capital as string;
        if (!capitalsByRegion.has(reg)) capitalsByRegion.set(reg, []);
        capitalsByRegion.get(reg)!.push(cap);
    }
    const allCapitals = valid.map((c) => c._capital as string);

    const out: QuestionOut[] = [];
    for (const c of valid) {
        const capital = c._capital as string;
        const region = c._region as string;

        try {
            const wrongs = pickDistractors(capital, region, capitalsByRegion, allCapitals);
            const q = buildQuestionForCountry(c, capital, wrongs);
            out.push(q);
            if (out.length >= MAX_QUESTIONS) break;
        } catch {
            continue; // 오답 부족 등은 스킵
        }
    }

    // 저장 여부 분기: SAVE_TO_DB=1 또는 --save 플래그 시 DB 저장
    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" =
        process.argv.includes("--replace") ? "replace" : "skip";

    if (true) {
        /// ----------------------- 여기 주석 풀어
        // const res = await saveGeneratedQuestions(out as any, {
        //     onDuplicate,
        //     validate: true,
        // });


        // 저장 결과 로그
        console.log(JSON.stringify(res, null, 2));
    } else {
        // 결과 출력(JSON)
        console.log(JSON.stringify(out, null, 2));
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

// (아래는 필요 없으면 삭제해도 됨)
export default function QuizEditPageDemo() {
    return <>수도</>;
}
