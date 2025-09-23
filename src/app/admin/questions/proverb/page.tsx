// scripts/build-proverb-questions.ts
/**
 * 사용법
 *   $ tsx scripts/build-proverb-questions.ts            # 콘솔에 JSON 출력
 *   $ SAVE_TO_DB=1 tsx scripts/build-proverb-questions.ts --save [--replace]
 *
 * 주의: 데이터 출처는 위키인용집(ko.wikiquote.org)이며 CC BY-SA 3.0 라이선스입니다.
 *       저장 시 문제 설명에 출처 문구를 함께 남깁니다.
 */

import * as cheerio from "cheerio";
import { saveGeneratedQuestions } from "@/core/repositroy/questions/question.create.repo";

/* ==================== 타입 (수도 스크립트와 동일 형태) ==================== */
type ChoiceOut = { content: string; is_correct: boolean; order_no: 1 | 2 | 3 | 4 };
type QuestionOut = {
    question: {
        category_id: number;
        type: "MCQ";
        stem: string;          // 문제 문장
        explanation: string;   // 해설
        difficulty: number;
        grade: string;
        language: "ko";
        status: "published";
    };
    choices: ChoiceOut[];
};

type ProverbItem = { proverb: string; meaning: string };

/* ==================== 설정 ==================== */
const SOURCE_URL =
    "https://ko.wikiquote.org/wiki/%EA%B0%80%EB%82%98%EB%8B%A4%EC%88%9C_%ED%95%9C%EA%B5%AD_%EC%86%8D%EB%8B%B4";
const CATEGORY_ID = 21;            // ← 속담 카테고리 id로 교체
const DIFFICULTY_DEFAULT = 1;
const GRADE_DEFAULT = "general";
const LANGUAGE: "ko" = "ko";
const MAX_QUESTIONS = Number(process.env.MAX_QUESTIONS ?? 0) || Infinity;

// 선택지 난이도 조절: 같은 초성군에서 오답을 우선 뽑을지
const PREFER_SAME_INITIAL = true;

/* ==================== 유틸 ==================== */
const zap = (s: string) =>
    s
        .replace(/\[[^\]]*\]/g, "")    // [주석], [번호] 제거
        .replace(/\s+/g, " ")
        .replace(/[ \t\u00A0]+/g, " ")
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

/** 한글 초성 추출 (간단 버전) */
function initialConsonant(ch: string): string | null {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    const initials = [
        "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
    ];
    const idx = Math.floor((code - 0xac00) / 588);
    return initials[idx] ?? null;
}

/* ==================== 파서: 위키인용집 본문 → {속담, 뜻} 리스트 ==================== */
async function fetchProverbs(): Promise<ProverbItem[]> {
    const res = await fetch(SOURCE_URL, { method: "GET" });
    if (!res.ok) throw new Error(`페이지 가져오기 실패: ${res.status} ${res.statusText}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // 본문 컨테이너
    const $root = $("#mw-content-text .mw-parser-output");
    if ($root.length === 0) throw new Error("본문 컨테이너를 찾지 못했습니다.");

    const items: ProverbItem[] = [];

    // 전략:
    // - 문서 구조는 [제목(ㄱ/ㄴ/...)] 다음에 여러 <ul><li>가 나오고
    //   종종 <p>가 "뜻" 설명으로 뒤따릅니다.
    // - 각 <li>의 다음 형제 중 <p>를 '뜻'으로 우선 사용,
    //   없으면 li 내부 텍스트에 포함된 ':' 또는 '—' 분리 시도.
    //
    // 가능한 변형을 대비해, 파싱 실패 항목은 스킵합니다.
    //
    $root.children().each((_, el) => {
        const tag = (el as any).tagName?.toLowerCase?.();
        if (tag !== "ul") return;

        const $ul = $(el);
        $ul.children("li").each((__, li) => {
            const $li = $(li);
            let proverb = zap($li.clone().children().remove().end().text()); // li의 순수 텍스트
            let meaning = "";

            // 1) li 다음 형제가 <p>면 그것을 뜻으로
            let $p = $li.next();
            if ($p.length && $p[0].tagName?.toLowerCase() === "p") {
                meaning = zap($p.text());
            }

            // 2) li 안에 구분자가 있으면 분리 시도 (가끔 '속담:뜻' 형태)
            if (!meaning) {
                const raw = zap($li.text());
                const byColon = raw.split(/[:：—-]\s*/); // :, ：, —, -
                if (byColon.length >= 2) {
                    proverb = zap(byColon[0]);
                    meaning = zap(byColon.slice(1).join(" "));
                }
            }

            // 필터링
            if (!proverb || proverb.length < 2) return;     // 너무 짧으면 패스
            if (!meaning || meaning.length < 2) return;     // 뜻이 없으면 패스

            // 위키 내 보조 문구 제거 힌트 (예: '영어 속담' 언급 등)
            meaning = meaning.replace(/영어 속담[^.]*\./g, "").trim();

            items.push({ proverb, meaning });
        });
    });

    // 중복 제거
    const seen = new Set<string>();
    const uniq = items.filter((it) => {
        const key = `${it.proverb}::${it.meaning}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return uniq;
}

/* ==================== 문제 빌더 ==================== */
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

/** 오답 3개 선택: 같은 초성 우선(옵션) */
function pickDistractors(
    correct: string,
    all: ProverbItem[],
    count = 3
): string[] {
    const exclude = new Set<string>([correct]);
    const allProverbs = all.map((x) => x.proverb);

    if (!PREFER_SAME_INITIAL) {
        const pool = allProverbs.filter((p) => !exclude.has(p));
        const picked = sampleN(pool, count);
        if (picked.length < count) throw new Error("오답 부족");
        return picked;
    }

    const ini = initialConsonant(correct[0] ?? "");
    const sameIni = allProverbs.filter(
        (p) => !exclude.has(p) && initialConsonant(p[0] ?? "") === ini
    );
    let picked = sampleN(sameIni, Math.min(count, sameIni.length));

    if (picked.length < count) {
        const remain = allProverbs.filter((p) => !exclude.has(p) && !picked.includes(p));
        picked = [...picked, ...sampleN(remain, count - picked.length)];
    }
    if (picked.length < count) throw new Error("오답 부족");
    return picked.slice(0, count);
}

/** 뜻 → 속담 고르기 (MCQ) */
function buildQuestion(item: ProverbItem, all: ProverbItem[]): QuestionOut {
    const stem = `다음 뜻에 맞는 속담은 무엇인가요?\n\n"${item.meaning}"`;
    const explanation =
        `정답: ${item.proverb}\n\n풀이: "${item.meaning}"\n\n출처: 위키인용집(가나다순 한국 속담), CC BY-SA 3.0`;

    const wrongs = pickDistractors(item.proverb, all, 3);
    const choices = buildChoices(item.proverb, wrongs);

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

/* ==================== 메인 ==================== */
async function main() {
    const items = await fetchProverbs();

    const out: QuestionOut[] = [];
    for (const it of items) {
        try {
            const q = buildQuestion(it, items);
            out.push(q);
            if (out.length >= MAX_QUESTIONS) break;
        } catch {
            // 오답 부족 등의 케이스는 스킵
            continue;
        }
    }

    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" =
        process.argv.includes("--replace") ? "replace" : "skip";
    // DB 저장
    // const res = await saveGeneratedQuestions(out as any, {
    //     onDuplicate,
    //     validate: true,
    // });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
