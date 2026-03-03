import { prisma } from "@/lib/db/prisma";

export type CreateAttemptAnswerInput = {
  attemptId: number;
  questionId?: number | null;
  orderNo: number;
  selectedIdx: number | null;
  correctIdx: number;
  isCorrect: boolean;
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

export async function createMany(
  items: CreateAttemptAnswerInput[],
): Promise<AttemptAnswerEntity[]> {
  if (items.length === 0) return [];

  const data = items.map((item) => ({
    attempt_id: BigInt(item.attemptId),
    question_id: item.questionId != null ? BigInt(item.questionId) : null,
    order_no: item.orderNo,
    selected_idx: item.selectedIdx,
    correct_idx: item.correctIdx,
    is_correct: item.isCorrect,
  }));

  await prisma.attempt_answer.createMany({ data });

  // createMany doesn't return records in Prisma, so we fetch them
  const rows = await prisma.attempt_answer.findMany({
    where: { attempt_id: BigInt(items[0].attemptId) },
    orderBy: { order_no: "asc" },
  });

  return rows.map((row) => ({
    id: Number(row.id),
    attempt_id: Number(row.attempt_id),
    question_id: row.question_id ? Number(row.question_id) : null,
    order_no: row.order_no,
    selected_idx: row.selected_idx,
    correct_idx: row.correct_idx,
    is_correct: row.is_correct,
    created_at: row.created_at ?? new Date(),
  }));
}
