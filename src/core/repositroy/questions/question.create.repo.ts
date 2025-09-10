// scripts/save-generated-questions.ts
/**
 * 목적: REST Countries 등에서 파싱한 JSON(아래 타입)을 받아
 *       quiz.question / quiz.choice 테이블에 저장합니다.
 *
 * 사용 예)
 *   import { saveGeneratedQuestions } from "./scripts/save-generated-questions";
 *   import data from "../data/capital_questions.json"; // QuestionInput[]
 *   await saveGeneratedQuestions(data, { onDuplicate: "skip" });
 *
 * 전제:
 *   - Postgres
 *   - pool: "@/lib/db/pool" 에서 export
 */

import { pool } from "@/lib/db/pool";

// ===== 입력 JSON 타입 (질문 + 보기 4지) =====
export type ChoiceInput = {
    content: string;
    is_correct: boolean;
    order_no: 1 | 2 | 3 | 4;
};

export type QuestionCoreInput = {
    category_id: number;
    type: "MCQ";
    stem: string;
    explanation?: string | null;
    difficulty: number;
    grade: string;
    language: string; // "ko"
    status: "published" | "draft";
};

export type QuestionInput = {
    question: QuestionCoreInput;
    choices: ChoiceInput[]; // 길이 4, 정답 1개, order_no 1..4
};

// ===== 옵션 & 결과 타입 =====
export type SaveOptions = {
    /**
     * onDuplicate:
     *  - "skip": 동일 (category_id, type, language, stem) 질문이 있으면 건너뜀 (기본)
     *  - "replace": 있으면 해당 질문의 choice를 모두 지우고, 질문/해설/난이도/상태를 갱신한 뒤 다시 choices 삽입
     */
    onDuplicate?: "skip" | "replace";
    /** 저장 전 검증 수행 여부 (기본 true) */
    validate?: boolean;
};

export type SaveResult = {
    inserted: number;
    replaced: number;
    skipped: number;
    failed: number;
    errors: Array<{ stem: string; reason: string }>;
};

// ===== 유틸: 검증 =====
function validateItem(i: QuestionInput) {
    const errs: string[] = [];

    // 질문 코어
    if (!i?.question) errs.push("question 누락");
    if (i.question.type !== "MCQ") errs.push("type은 'MCQ'만 허용");
    if (!i.question.stem?.trim()) errs.push("stem(문항)이 비어 있음");
    if (!Number.isFinite(i.question.category_id)) errs.push("category_id 누락");
    if (!Number.isFinite(i.question.difficulty)) errs.push("difficulty 누락");
    if (!i.question.language) errs.push("language 누락");
    if (!i.question.status) errs.push("status 누락");

    // 보기 4지
    if (!Array.isArray(i.choices) || i.choices.length !== 4) {
        errs.push("choices는 4개여야 함");
    } else {
        const correctCount = i.choices.filter((c) => c.is_correct === true).length;
        if (correctCount !== 1) errs.push("정답은 정확히 1개여야 함");
        const orderNos = new Set(i.choices.map((c) => c.order_no));
        if (orderNos.size !== 4 || ![1, 2, 3, 4].every((n) => orderNos.has(n as 1 | 2 | 3 | 4))) {
            errs.push("order_no는 1..4 각각 한 번씩이어야 함");
        }
        if (i.choices.some((c) => !c.content?.trim())) errs.push("보기 content에 빈 값 존재");
    }

    return errs;
}

// ===== 핵심: 저장 함수 =====
export async function saveGeneratedQuestions(
    data: QuestionInput[],
    opts: SaveOptions = {},
): Promise<SaveResult> {
    const onDuplicate = opts.onDuplicate ?? "skip";
    const doValidate = opts.validate ?? true;

    const client = await pool.connect();
    const result: SaveResult = { inserted: 0, replaced: 0, skipped: 0, failed: 0, errors: [] };

    try {
        await client.query("BEGIN");

        for (const item of data) {
            const stemLabel = item?.question?.stem ?? "(unknown)";

            // 검증
            if (doValidate) {
                const errs = validateItem(item);
                if (errs.length) {
                    result.failed++;
                    result.errors.push({ stem: stemLabel, reason: errs.join("; ") });
                    continue;
                }
            }

            const q = item.question;

            // 중복 검사: 동일 (category_id, type, language, stem)
            const checkSql = `
        SELECT id
        FROM quiz.question
        WHERE category_id = $1 AND "type" = $2 AND language = $3 AND stem = $4
        LIMIT 1
      `;
            const checkRes = await client.query<{ id: number }>(checkSql, [q.category_id, q.type, q.language, q.stem]);
            const existsId = checkRes.rows[0]?.id ?? null;

            let questionId: number;

            if (existsId && onDuplicate === "skip") {
                result.skipped++;
                continue;
            }

            if (existsId && onDuplicate === "replace") {
                // 질문 업데이트
                const updSql = `
          UPDATE quiz.question
             SET explanation = $1,
                 difficulty  = $2,
                 grade       = $3,
                 status      = $4,
                 updated_at  = NOW()
           WHERE id = $5
        `;
                await client.query(updSql, [
                    q.explanation ?? null,
                    q.difficulty,
                    q.grade,
                    q.status,
                    existsId,
                ]);

                // 기존 choice 삭제 후 재삽입
                await client.query(`DELETE FROM quiz.choice WHERE question_id = $1`, [existsId]);
                questionId = existsId;
            } else if (!existsId) {
                // 새 질문 INSERT
                const insSql = `
          INSERT INTO quiz.question
            (category_id, "type", stem, explanation, difficulty, grade, language, status, created_by)
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
          RETURNING id
        `;
                const insRes = await client.query<{ id: number }>(insSql, [
                    q.category_id,
                    q.type,
                    q.stem,
                    q.explanation ?? null,
                    q.difficulty,
                    q.grade,
                    q.language,
                    q.status,
                ]);
                questionId = insRes.rows[0].id;
            } else {
                // 이론상 도달 불가
                result.failed++;
                result.errors.push({ stem: stemLabel, reason: "알 수 없는 중복 처리 상태" });
                continue;
            }

            // choices bulk insert
            const vals: any[] = [];
            const placeholders: string[] = [];
            item.choices
                .sort((a, b) => a.order_no - b.order_no)
                .forEach((c, idx) => {
                    // ($1, $2, $3, $4) → question_id, content, is_correct, order_no
                    const base = idx * 3;
                    placeholders.push(`($1, $${base + 2}, $${base + 3}, $${base + 4})`);
                    vals.push(c.content, c.is_correct, c.order_no);
                });

            const choiceSql = `
        INSERT INTO quiz.choice (question_id, content, is_correct, order_no)
        VALUES ${placeholders.join(",")}
      `;
            await client.query(choiceSql, [questionId, ...vals]);

            if (existsId && onDuplicate === "replace") result.replaced++;
            else result.inserted++;
        }

        await client.query("COMMIT");
        return result;
    } catch (err: any) {
        await client.query("ROLLBACK");
        result.failed += data.length - (result.inserted + result.replaced + result.skipped + result.failed);
        result.errors.push({ stem: "(transaction)", reason: String(err?.message ?? err) });
        return result;
    } finally {
        client.release();
    }
}

/* ==================== 참고 실행 코드 (예시) ====================
import input from "../data/capital_question_sample.json"; // QuestionInput[]
(async () => {
  const res = await saveGeneratedQuestions(input, { onDuplicate: "skip" });
  console.log(res);
})();
*/


/*
[
  {
    "question": {
      "category_id": 1,
      "type": "MCQ",
      "stem": "대한민국의 수도는 어디인가요?",
      "explanation": "대한민국의 수도는 서울입니다.",
      "difficulty": 1,
      "grade": "general",
      "language": "ko",
      "status": "published"
    },
    "choices": [
      { "content": "서울", "is_correct": true, "order_no": 1 },
      { "content": "부산", "is_correct": false, "order_no": 2 },
      { "content": "대구", "is_correct": false, "order_no": 3 },
      { "content": "인천", "is_correct": false, "order_no": 4 }
    ]
  },
  {
    "question": {
      "category_id": 2,
      "type": "MCQ",
      "stem": "에펠탑이 위치한 도시는 어디인가요?",
      "explanation": "에펠탑은 프랑스 파리에 위치합니다.",
      "difficulty": 2,
      "grade": "general",
      "language": "ko",
      "status": "draft"
    },
    "choices": [
      { "content": "런던", "is_correct": false, "order_no": 1 },
      { "content": "파리", "is_correct": true, "order_no": 2 },
      { "content": "베를린", "is_correct": false, "order_no": 3 },
      { "content": "마드리드", "is_correct": false, "order_no": 4 }
    ]
  }
]

*/

