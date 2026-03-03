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

export type QuizSetDetailItem = {
  question_id: number;
  order_no: number | null;
  points: number;
  stem: string | null;
  type: string | null;
  choicesCount: number;
  correctCount: number;
  videoReady: boolean;
};

export type QuizSetDetail = {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  items: QuizSetDetailItem[];
};

export async function getQuizSetDetail(quizSetId: number): Promise<QuizSetDetail | null> {
  if (!Number.isInteger(quizSetId) || quizSetId <= 0) return null;

  const row = await prisma.quiz_set.findUnique({
    where: { id: BigInt(quizSetId) },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      quiz_set_questions: {
        orderBy: [{ order_no: { sort: 'asc', nulls: 'last' } }, { question_id: 'asc' }],
        select: {
          question_id: true,
          order_no: true,
          points: true,
          question: {
            select: {
              stem: true,
              type: true,
              choices: {
                select: { is_correct: true },
              },
            },
          },
        },
      },
    },
  });

  if (!row) return null;

  const items: QuizSetDetailItem[] = row.quiz_set_questions.map((item) => {
    const choicesCount = item.question.choices.length;
    const correctCount = item.question.choices.filter((choice) => choice.is_correct).length;
    const videoReady =
      (item.question.type ?? '').toUpperCase() === 'MCQ' &&
      !!item.question.stem?.trim() &&
      choicesCount === 4 &&
      correctCount === 1;

    return {
      question_id: Number(item.question_id),
      order_no: item.order_no,
      points: Number(item.points),
      stem: item.question.stem,
      type: item.question.type,
      choicesCount,
      correctCount,
      videoReady,
    };
  });

  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    status: row.status as 'draft' | 'published' | 'archived',
    items,
  };
}

export async function reorderQuizSetItems(input: {
  quizSetId: number;
  questionIdsInOrder: number[];
}): Promise<{ success: boolean; message?: string }> {
  if (!Number.isInteger(input.quizSetId) || input.quizSetId <= 0) {
    return { success: false, message: 'Invalid quiz set id.' };
  }
  if (!Array.isArray(input.questionIdsInOrder) || input.questionIdsInOrder.length === 0) {
    return { success: false, message: 'questionIdsInOrder is required.' };
  }

  const orderedIds = Array.from(
    new Set(
      input.questionIdsInOrder
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  await prisma.$transaction(async (tx) => {
    const rows = await tx.quiz_set_question.findMany({
      where: { quiz_id: BigInt(input.quizSetId) },
      select: { question_id: true },
    });
    const existingIds = rows.map((row) => Number(row.question_id));

    if (existingIds.length !== orderedIds.length) {
      throw new Error('Order size mismatch.');
    }

    const existingSet = new Set(existingIds);
    for (const id of orderedIds) {
      if (!existingSet.has(id)) {
        throw new Error('Order includes unknown question id.');
      }
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await tx.quiz_set_question.update({
        where: {
          quiz_id_question_id: {
            quiz_id: BigInt(input.quizSetId),
            question_id: BigInt(orderedIds[index]),
          },
        },
        data: { order_no: index + 1 },
      });
    }
  });

  return { success: true };
}

export async function removeQuizSetItem(input: {
  quizSetId: number;
  questionId: number;
}): Promise<{ success: boolean; message?: string }> {
  if (!Number.isInteger(input.quizSetId) || input.quizSetId <= 0) {
    return { success: false, message: 'Invalid quiz set id.' };
  }
  if (!Number.isInteger(input.questionId) || input.questionId <= 0) {
    return { success: false, message: 'Invalid question id.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.quiz_set_question.delete({
      where: {
        quiz_id_question_id: {
          quiz_id: BigInt(input.quizSetId),
          question_id: BigInt(input.questionId),
        },
      },
    });

    const rows = await tx.quiz_set_question.findMany({
      where: { quiz_id: BigInt(input.quizSetId) },
      orderBy: [{ order_no: { sort: 'asc', nulls: 'last' } }, { question_id: 'asc' }],
      select: { question_id: true },
    });

    for (let index = 0; index < rows.length; index += 1) {
      await tx.quiz_set_question.update({
        where: {
          quiz_id_question_id: {
            quiz_id: BigInt(input.quizSetId),
            question_id: rows[index].question_id,
          },
        },
        data: { order_no: index + 1 },
      });
    }
  });

  return { success: true };
}

export async function publishQuizSet(input: {
  quizSetId: number;
}): Promise<{ success: boolean; message?: string; invalidQuestionIds?: number[] }> {
  const detail = await getQuizSetDetail(input.quizSetId);
  if (!detail) return { success: false, message: 'Quiz set not found.' };
  if (detail.items.length === 0) {
    return { success: false, message: 'Quiz set is empty.' };
  }

  const invalidQuestionIds = detail.items
    .filter((item) => !item.videoReady)
    .map((item) => item.question_id);

  if (invalidQuestionIds.length > 0) {
    return {
      success: false,
      message: 'Some questions are not video-ready.',
      invalidQuestionIds,
    };
  }

  await prisma.quiz_set.update({
    where: { id: BigInt(input.quizSetId) },
    data: { status: 'published' },
  });

  return { success: true, message: 'Published.' };
}
