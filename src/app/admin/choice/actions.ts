'use server';

import { prisma } from '@/lib/db/prisma';

export type ChoiceCreateInput = {
  content: string;
  is_correct: boolean;
  order_no?: number | null;
};

export type SaveMCQQuestionInput = {
  stem: string;
  explanation?: string | null;
  difficulty?: number | null;
  grade?: string | null;
  language?: string | null;
  status: 'published' | 'draft';
  category_id: number;
  choices: ChoiceCreateInput[];
};

export async function saveMCQQuestion(
  input: SaveMCQQuestionInput,
): Promise<{ success: boolean; id: number; message?: string }> {
  try {
    if (!input.stem?.trim()) throw new Error('Question is required.');
    if (!input.category_id) throw new Error('Category is required.');
    if (!Array.isArray(input.choices) || input.choices.length !== 4) {
      throw new Error('Exactly 4 choices are required.');
    }

    const normalizedChoices = input.choices.map((choice) => ({
      ...choice,
      content: (choice.content ?? '').trim(),
    }));

    if (normalizedChoices.some((choice) => !choice.content)) {
      throw new Error('All choices must be non-empty.');
    }

    const dedup = new Set(normalizedChoices.map((c) => c.content.toLowerCase()));
    if (dedup.size !== normalizedChoices.length) {
      throw new Error('Choices must be unique.');
    }

    const correctCount = normalizedChoices.filter((choice) => choice.is_correct).length;
    if (correctCount !== 1) {
      throw new Error('Exactly one correct choice is required.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          category_id: BigInt(input.category_id),
          type: 'MCQ',
          stem: input.stem.trim(),
          explanation: input.explanation?.trim() || null,
          difficulty: input.difficulty ?? null,
          grade: input.grade || 'general',
          language: input.language || 'ko',
          status: input.status,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.choice.createMany({
        data: normalizedChoices.map((choice, index) => ({
          question_id: question.id,
          content: choice.content,
          is_correct: choice.is_correct,
          order_no: choice.order_no ?? index + 1,
        })),
      });

      return question;
    });

    return { success: true, id: Number(result.id), message: 'Saved.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save question.';
    return { success: false, id: 0, message };
  }
}

