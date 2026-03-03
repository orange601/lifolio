import { prisma } from "@/lib/db/prisma";

export type CreateAttemptInput = {
  userId: string;
  mode: string;
  questionCnt: number;
  score: number;
  totalTimeMs: number;
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

export async function createOne(input: CreateAttemptInput): Promise<AttemptEntity> {
  const row = await prisma.attempt.create({
    data: {
      user_id: input.userId,
      mode: input.mode,
      question_cnt: input.questionCnt,
      score: input.score,
      total_time_ms: input.totalTimeMs,
    },
  });

  return {
    id: Number(row.id),
    user_id: row.user_id,
    mode: row.mode ?? "rank_5s",
    question_cnt: row.question_cnt,
    score: row.score,
    total_time_ms: row.total_time_ms,
    created_at: row.created_at,
  };
}
