'use server';

import { prisma } from '@/lib/db/prisma';

export type QuizSetItem = { id: number; title: string; status: 'draft' | 'published' | 'archived'; is_random: boolean }

export async function listQuizSets(): Promise<QuizSetItem[]> {
  const rows = await prisma.quiz_set.findMany({
    select: { id: true, title: true, status: true, is_random: true },
    orderBy: { id: "desc" },
  });
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    status: r.status as 'draft' | 'published' | 'archived',
    is_random: r.is_random ?? false,
  }));
}

export async function addQuestionToQuizSet(input: {
  quiz_id: number;
  question_id: number;
  order_no?: number | null;
  points?: number | null;
}): Promise<void> {
  await prisma.quiz_set_question.upsert({
    where: {
      quiz_id_question_id: {
        quiz_id: BigInt(input.quiz_id),
        question_id: BigInt(input.question_id),
      },
    },
    update: {
      order_no: input.order_no ?? null,
      points: input.points ?? 1,
    },
    create: {
      quiz_id: BigInt(input.quiz_id),
      question_id: BigInt(input.question_id),
      order_no: input.order_no ?? null,
      points: input.points ?? 1,
    },
  });
}

export async function saveQuizSet(input: {
  title: string;
  description?: string | null;
  is_random?: boolean;
  items: { question_id: number; order_no?: number; points?: number }[];
}) {
  if (!input?.title?.trim()) throw new Error('title은 필수입니다.');
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('items는 1개 이상이어야 합니다.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const quizSet = await tx.quiz_set.create({
      data: {
        title: input.title.trim(),
        description: input.description ?? null,
        is_random: !!input.is_random,
        status: 'draft',
      },
    });

    await tx.quiz_set_question.createMany({
      data: input.items.map((it, i) => ({
        quiz_id: quizSet.id,
        question_id: BigInt(it.question_id),
        order_no: it.order_no ?? i + 1,
        points: it.points ?? 1,
      })),
    });

    return { id: Number(quizSet.id) };
  });

  return result;
}
