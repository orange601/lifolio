import { prisma } from "@/lib/db/prisma";

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
  options: string[] | null;
  correct_idx: number;
  selected_idx: number | null;
  is_correct: boolean;
  explanation: string | null;
};

export type AttemptReview = {
  attempt: AttemptHeader;
  items: AttemptReviewItem[];
};

export async function findAttemptReview(attemptId: number, userId: string): Promise<AttemptReview | null> {
  const attemptRow = await prisma.attempt.findFirst({
    where: {
      id: BigInt(attemptId),
      user_id: userId,
    },
  });

  if (!attemptRow) return null;

  const answers = await prisma.attempt_answer.findMany({
    where: { attempt_id: BigInt(attemptId) },
    include: {
      question: {
        include: {
          choices: {
            orderBy: { order_no: "asc" },
          },
        },
      },
    },
    orderBy: { order_no: "asc" },
  });

  const items: AttemptReviewItem[] = answers.map((r) => ({
    order_no: r.order_no,
    question_id: r.question_id ? Number(r.question_id) : null,
    question: r.question?.stem ?? null,
    options: r.question?.choices.map((c) => c.content) ?? null,
    correct_idx: r.correct_idx,
    selected_idx: r.selected_idx,
    is_correct: r.is_correct,
    explanation: r.question?.explanation ?? null,
  }));

  const attempt: AttemptHeader = {
    id: Number(attemptRow.id),
    user_id: attemptRow.user_id,
    mode: attemptRow.mode ?? "rank_5s",
    question_cnt: attemptRow.question_cnt,
    score: attemptRow.score,
    total_time_ms: attemptRow.total_time_ms,
    created_at: attemptRow.created_at.toISOString(),
  };

  return { attempt, items };
}
