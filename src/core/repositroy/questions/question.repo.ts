// question.repo.ts

import { pool } from "@/lib/db/pool";
import { QuestionWithChoices, QuizItem } from "./question.type";

type FindOptions = {
  limit?: number;         // 기본 10
  random?: boolean;       // true면 ORDER BY random()
};

/**
 * 객관식만 조회, 보기는 무조건 4개가 나온다고 설정
 */
export async function findAllMcq(
  categoryId: number,
  difficulty: number,
  opts: FindOptions = {},
): Promise<QuestionWithChoices[]> {
  const limitRaw = Number.isFinite(opts.limit as number) ? Number(opts.limit) : 10;
  const limit = Math.max(1, limitRaw);
  const orderBy = opts.random ? "ORDER BY random()" : "ORDER BY q.created_at DESC";

  const sql = `
    SELECT 
      q.id,
      q.category_id,
      q."type",
      q.stem,
      q.explanation,
      q.difficulty,
      q.grade,
      q.language,
      q.status,
      q.created_by,
      q.created_at,
      q.updated_at,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', c.id,
          'content', c.content,
          'is_correct', c.is_correct,
          'order_no', c.order_no
        )
        ORDER BY c.order_no
      ) AS choices
    FROM quiz.question q
    JOIN quiz.choice c ON c.question_id = q.id
    WHERE q.category_id = $1
      AND q.difficulty = $2
      AND q.type = 'MCQ'
      AND q.status = 'published'
    GROUP BY 
      q.id, q.category_id, q."type", q.stem, q.explanation, q.difficulty,
      q.grade, q.language, q.status, q.created_by, q.created_at, q.updated_at
    HAVING 
      COUNT(c.id) = 4
      AND SUM(CASE WHEN c.is_correct THEN 1 ELSE 0 END) = 1
      AND BOOL_AND(c.order_no IS NOT NULL)
      AND BOOL_AND(c.order_no BETWEEN 1 AND 4)
    ${orderBy}
    LIMIT $3
  `;
  const { rows } = await pool.query<QuestionWithChoices>(sql, [categoryId, difficulty, limit]);
  return rows;
}

/** 
 * 프런트에서 바로 쓰는 형태로 매핑 (1-based correctOrderNo 보장)
 */
export async function findAllQuizItems(
  categoryId: number,
  difficulty: number,
  opts: FindOptions = {},
): Promise<QuizItem[]> {
  const rows = await findAllMcq(categoryId, difficulty, opts);

  return rows.map((r) => {
    const sorted = [...r.choices].sort(
      (a, b) => (a.order_no ?? Number.MAX_SAFE_INTEGER) - (b.order_no ?? Number.MAX_SAFE_INTEGER)
    );

    if (sorted.length !== 4) {
      throw new Error(`Invalid MCQ: question ${r.id} must have exactly 4 choices`);
    }
    const correctIndex = sorted.findIndex((c) => c.is_correct === true);
    if (correctIndex < 0) {
      throw new Error(`Invalid data: no correct choice for question ${r.id}`);
    }

    const options = sorted.map((c) => c.content);
    const correctOrderNo = sorted[correctIndex].order_no ?? (correctIndex + 1);

    return {
      id: String(r.id),
      question: r.stem,
      options,
      explanation: r.explanation,
      correctOrderNo, // 1-based 보장
    };
  });
}




export async function findQuestionsWithChoicesByCategoryAndDifficulty(
  categoryId: number,
  difficulty: number,
): Promise<QuestionWithChoices[]> {
  const sql = `
    SELECT 
      q.id,
      q.category_id,
      q."type",
      q.stem,
      q.explanation,
      q.difficulty,
      q.grade,
      q.language,
      q.status,
      q.created_by,
      q.created_at,
      q.updated_at,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', c.id,
            'content', c.content,
            'is_correct', c.is_correct,
            'order_no', c.order_no
          )
          ORDER BY c.order_no NULLS LAST
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
      ) AS choices
    FROM quiz.question q
    LEFT JOIN quiz.choice c ON c.question_id = q.id
    WHERE q.category_id = $1
      AND q.difficulty = $2
    GROUP BY 
      q.id, q.category_id, q."type", q.stem, q.explanation, q.difficulty,
      q.grade, q.language, q.status, q.created_by, q.created_at, q.updated_at
    ORDER BY q.created_at DESC
  `;
  const { rows } = await pool.query<QuestionWithChoices>(sql, [categoryId, difficulty]);
  return rows;
}

/** 
 * 문제와 문제보기들 목록 조회
 */
export async function findQuizItems(
  categoryId: number,
  difficulty: number,
): Promise<QuizItem[]> {
  const rows = await findQuestionsWithChoicesByCategoryAndDifficulty(categoryId, difficulty);

  return rows.map((r) => {
    const sorted = [...r.choices].sort(
      (a, b) => (a.order_no ?? Number.MAX_SAFE_INTEGER) - (b.order_no ?? Number.MAX_SAFE_INTEGER)
    );
    const options = sorted.map((c) => c.content);
    const correctChoice = sorted.find((c) => c.is_correct === true);
    const correctOrderNo = correctChoice?.order_no ?? 0; // 없으면 0으로 보정
    return {
      id: String(r.id),
      question: r.stem,
      options,
      explanation: r.explanation,
      correctOrderNo,
    };
  });
}