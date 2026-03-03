'use server';

import { prisma } from '@/lib/db/prisma';

type CreateVideoSetInput = {
  title: string;
  questionIds: number[];
};

export type CreateVideoSetResult = {
  success: boolean;
  quizSetId?: number;
  savedCount?: number;
  message?: string;
  invalidQuestionIds?: number[];
};

export async function createVideoSetFromQuestions(
  input: CreateVideoSetInput,
): Promise<CreateVideoSetResult> {
  try {
    const title = input.title?.trim();
    if (!title) {
      return { success: false, message: 'Title is required.' };
    }

    const ids = Array.from(
      new Set(
        (input.questionIds ?? [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );

    if (ids.length === 0) {
      return { success: false, message: 'At least one question must be selected.' };
    }

    const rows = await prisma.question.findMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
      },
      select: {
        id: true,
        type: true,
        stem: true,
        choices: {
          select: {
            is_correct: true,
          },
        },
      },
    });

    const byId = new Map(rows.map((row) => [Number(row.id), row]));
    const invalidQuestionIds: number[] = [];

    for (const id of ids) {
      const row = byId.get(id);
      if (!row) {
        invalidQuestionIds.push(id);
        continue;
      }

      if ((row.type ?? '').toUpperCase() !== 'MCQ') {
        invalidQuestionIds.push(id);
        continue;
      }

      if (!row.stem?.trim()) {
        invalidQuestionIds.push(id);
        continue;
      }

      if (row.choices.length !== 4) {
        invalidQuestionIds.push(id);
        continue;
      }

      const correctCount = row.choices.filter((choice) => choice.is_correct).length;
      if (correctCount !== 1) {
        invalidQuestionIds.push(id);
      }
    }

    if (invalidQuestionIds.length > 0) {
      return {
        success: false,
        message: 'Some questions are not video-ready (MCQ, 4 choices, single correct).',
        invalidQuestionIds,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const quizSet = await tx.quiz_set.create({
        data: {
          title,
          description: 'Created from question list selection for video.',
          is_random: false,
          status: 'draft',
        },
      });

      await tx.quiz_set_question.createMany({
        data: ids.map((questionId, index) => ({
          quiz_id: quizSet.id,
          question_id: BigInt(questionId),
          order_no: index + 1,
          points: 1,
        })),
      });

      return {
        quizSetId: Number(quizSet.id),
        savedCount: ids.length,
      };
    });

    return {
      success: true,
      quizSetId: result.quizSetId,
      savedCount: result.savedCount,
      message: 'Video set created.',
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while creating video set.';
    return { success: false, message };
  }
}
