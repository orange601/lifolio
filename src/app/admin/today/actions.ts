'use server';

import { prisma } from '@/lib/db/prisma';

export type SaveQuestionInput = {
  type: 'MCQ' | 'SUBJECTIVE'
  stem: string
  explanation?: string | null
  difficulty?: number | null
  grade?: string | null
  language?: string | null
  status: 'published' | 'draft'
  category_id: number
  subjective_answer?: string | null
}

export async function saveQuestion(
  input: SaveQuestionInput,
): Promise<{ success: boolean; id: number }> {
  try {
    if (!input.stem?.trim()) throw new Error('문제를 입력하세요 (stem).');
    if (!input.category_id) throw new Error('카테고리를 선택하세요.');
    if (input.type === 'SUBJECTIVE' && !input.subjective_answer?.trim()) {
      throw new Error('주관식 정답을 입력하세요.');
    }

    const row = await prisma.question.create({
      data: {
        category_id: BigInt(input.category_id),
        type: input.type,
        stem: input.stem,
        subjective_answer: input.type === 'SUBJECTIVE' ? input.subjective_answer : null,
        explanation: input.explanation ?? null,
        difficulty: input.difficulty ?? null,
        grade: input.grade ?? 'general',
        language: input.language ?? 'ko',
        status: input.status,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { success: true, id: Number(row.id) };
  } catch {
    return { success: false, id: 0 };
  }
}
