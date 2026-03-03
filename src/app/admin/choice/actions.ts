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
  singleCorrect?: boolean;
};

export async function saveMCQQuestion(
  input: SaveMCQQuestionInput,
): Promise<{ success: boolean; id: number }> {
  try {
    if (!input.stem?.trim()) throw new Error('문제를 입력하세요 (stem).');
    if (!input.category_id) throw new Error('카테고리를 선택하세요.');
    if (!Array.isArray(input.choices) || input.choices.length < 2) {
      throw new Error('객관식 보기는 최소 2개 이상이어야 합니다.');
    }
    const hasCorrect = input.choices.some((c) => !!c.is_correct);
    if (!hasCorrect) throw new Error('정답으로 표시된 보기가 1개 이상 필요합니다.');
    if (input.singleCorrect !== false) {
      const countCorrect = input.choices.filter((c) => c.is_correct).length;
      if (countCorrect !== 1) throw new Error('단일 정답만 허용됩니다. 정답은 정확히 1개여야 합니다.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          category_id: BigInt(input.category_id),
          type: 'MCQ',
          stem: input.stem,
          explanation: input.explanation ?? null,
          difficulty: input.difficulty ?? null,
          grade: input.grade ?? 'general',
          language: input.language ?? 'ko',
          status: input.status,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.choice.createMany({
        data: input.choices.map((ch, i) => {
          const content = (ch.content ?? '').trim();
          if (!content) throw new Error(`보기 #${i + 1} 내용이 비어 있습니다.`);
          return {
            question_id: question.id,
            content,
            is_correct: !!ch.is_correct,
            order_no: ch.order_no != null ? ch.order_no : i + 1,
          };
        }),
      });

      return { id: Number(question.id) };
    });

    return { success: true, id: result.id };
  } catch {
    return { success: false, id: 0 };
  }
}
