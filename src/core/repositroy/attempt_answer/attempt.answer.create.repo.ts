import { pool } from "@/lib/db/pool";
import { toNum } from "@/utils/number";

export type CreateAttemptAnswerInput = {
    attemptId: number;
    questionId?: number | null;
    orderNo: number;
    selectedIdx: number | null;
    correctIdx: number;
    isCorrect: boolean;
};

export type AttemptAnswerRowRaw = {
    id: string;
    attempt_id: string;
    question_id: string | null;
    order_no: number;
    selected_idx: number | null;
    correct_idx: number;
    is_correct: boolean;
    created_at: Date;
};

export type AttemptAnswerEntity = {
    id: number;
    attempt_id: number;
    question_id: number | null;
    order_no: number;
    selected_idx: number | null;
    correct_idx: number;
    is_correct: boolean;
    created_at: Date;
};

// 여러 개 bulk insert
export async function createMany(
    items: CreateAttemptAnswerInput[]
): Promise<AttemptAnswerEntity[]> {
    if (items.length === 0) return [];

    const values = items
        .map(
            (_, i) =>
                `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
        )
        .join(",");

    const sql = `
    INSERT INTO quiz.attempt_answer 
      (attempt_id, question_id, order_no, selected_idx, correct_idx, is_correct)
    VALUES ${values}
    RETURNING id, attempt_id, question_id, order_no, selected_idx, correct_idx, is_correct, created_at
  `;

    const params = items.flatMap((item) => [
        item.attemptId,
        item.questionId ?? null,
        item.orderNo,
        item.selectedIdx,
        item.correctIdx,
        item.isCorrect,
    ]);

    const { rows } = await pool.query<AttemptAnswerRowRaw>(sql, params);

    return rows.map((row) => ({
        id: toNum(row.id)!,
        attempt_id: toNum(row.attempt_id)!,
        question_id: row.question_id ? toNum(row.question_id) : null,
        order_no: row.order_no,
        selected_idx: row.selected_idx,
        correct_idx: row.correct_idx,
        is_correct: row.is_correct,
        created_at: row.created_at,
    }));
}
