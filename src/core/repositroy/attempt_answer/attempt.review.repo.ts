import { pool } from "@/lib/db/pool";

export type AttemptHeader = {
    id: number;
    user_id: string;
    mode: string;
    question_cnt: number;
    score: number;
    total_time_ms: number;
    created_at: string;
};

export type AttemptReviewItem = {
    order_no: number;
    question_id: number | null;
    question: string | null;
    options: string[] | null;         // choice.content 순서대로
    correct_idx: number;              // 0-based
    selected_idx: number | null;      // 0-based or null
    is_correct: boolean;
    explanation: string | null;
};

export type AttemptReview = {
    attempt: AttemptHeader;
    items: AttemptReviewItem[];
};

/** 본인 소유의 attempt 인지 검증 포함 */
export async function findAttemptReview(attemptId: number, userId: string): Promise<AttemptReview | null> {
    const client = await pool.connect();
    try {
        // 1) attempt header (소유자 검증)
        const aRes = await client.query(
            `SELECT id, user_id, mode, question_cnt, score, total_time_ms, created_at
       FROM quiz.attempt
       WHERE id = $1 AND user_id = $2`,
            [attemptId, userId]
        );
        if (aRes.rowCount === 0) return null;
        const a = aRes.rows[0];

        // 2) attempt_answer + question + choice
        const iRes = await client.query(
            `
      SELECT 
        aa.order_no,
        aa.selected_idx,
        aa.correct_idx,
        aa.is_correct,
        q.id AS question_id,
        q.stem AS question,
        q.explanation,
        CASE 
          WHEN q.id IS NULL THEN NULL
          ELSE (
            SELECT JSON_AGG(c.content ORDER BY c.order_no)
            FROM quiz.choice c
            WHERE c.question_id = q.id
          )
        END AS options
      FROM quiz.attempt_answer aa
      LEFT JOIN quiz.question q ON q.id = aa.question_id
      WHERE aa.attempt_id = $1
      ORDER BY aa.order_no ASC
      `,
            [attemptId]
        );

        const items: AttemptReviewItem[] = iRes.rows.map((r) => ({
            order_no: Number(r.order_no),
            question_id: r.question_id !== null ? Number(r.question_id) : null,
            question: r.question ?? null,
            options: r.options ?? null,
            correct_idx: Number(r.correct_idx),
            selected_idx: r.selected_idx === null ? null : Number(r.selected_idx),
            is_correct: Boolean(r.is_correct),
            explanation: r.explanation ?? null,
        }));

        const attempt: AttemptHeader = {
            id: Number(a.id),
            user_id: a.user_id,
            mode: a.mode,
            question_cnt: Number(a.question_cnt),
            score: Number(a.score),
            total_time_ms: Number(a.total_time_ms),
            created_at: a.created_at,
        };

        return { attempt, items };
    } finally {
        client.release();
    }
}
