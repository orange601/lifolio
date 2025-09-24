import { pool } from "@/lib/db/pool";
import { toNum } from "@/utils/number";

export type CreateAttemptInput = {
    userId: string;
    mode: string;
    questionCnt: number;
    score: number;
    totalTimeMs: number;
};

export type AttemptRowRaw = {
    id: string;              // BIGSERIAL → 문자열로 반환됨
    user_id: string;         // Clerk user.id (TEXT)
    mode: string;
    question_cnt: number;
    score: number;
    total_time_ms: number;
    created_at: Date;
};

export type AttemptEntity = {
    id: number;
    user_id: string;
    mode: string;
    question_cnt: number;
    score: number;
    total_time_ms: number;
    created_at: Date;
};

// INSERT 쿼리
const INSERT_ONE = `
  INSERT INTO quiz.attempt (user_id, mode, question_cnt, score, total_time_ms)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, user_id, mode, question_cnt, score, total_time_ms, created_at
`;

/**
 * attempt 1건 생성
 * @param input CreateAttemptInput
 * @returns AttemptEntity
 */
export async function createOne(
    input: CreateAttemptInput
): Promise<AttemptEntity> {
    const { mode, userId, questionCnt, score, totalTimeMs } = input;

    const results = await pool.query<AttemptRowRaw>(INSERT_ONE, [
        userId,
        mode,
        questionCnt,
        score,
        totalTimeMs,
    ]);

    const row = results.rows[0];
    return {
        id: toNum(row.id)!,
        user_id: row.user_id,
        mode: row.mode,
        question_cnt: row.question_cnt,
        score: row.score,
        total_time_ms: row.total_time_ms,
        created_at: row.created_at,
    };
}
