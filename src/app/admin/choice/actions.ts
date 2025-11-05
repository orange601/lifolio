'use server';

import { pool } from '@/lib/db/pool';

// --- Types ---
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
    choices: ChoiceCreateInput[];           // 최소 2개, 정답 ≥ 1개
    singleCorrect?: boolean;                // 기본: true (단일정답 강제)
};

export async function saveMCQQuestion(
    input: SaveMCQQuestionInput
): Promise<{ success: boolean; id: number }> {
    const client = await pool.connect();
    try {
        // --- 기본 검증 ---
        if (!input.stem?.trim()) throw new Error('문제를 입력하세요 (stem).');
        if (!input.category_id) throw new Error('카테고리를 선택하세요.');
        if (!Array.isArray(input.choices) || input.choices.length < 2) {
            throw new Error('객관식 보기는 최소 2개 이상이어야 합니다.');
        }
        const hasCorrect = input.choices.some(c => !!c.is_correct);
        if (!hasCorrect) throw new Error('정답으로 표시된 보기가 1개 이상 필요합니다.');
        if (input.singleCorrect !== false) {
            const countCorrect = input.choices.filter(c => c.is_correct).length;
            if (countCorrect !== 1) throw new Error('단일 정답만 허용됩니다. 정답은 정확히 1개여야 합니다.');
        }

        await client.query('BEGIN');

        // 1) question insert (type = MCQ)
        const qSql = `
      INSERT INTO quiz.question
        (category_id, "type", stem, subjective_answer, explanation, difficulty, grade, language, status, created_at, updated_at)
      VALUES
        ($1, 'MCQ', $2, NULL, $3, $4, $5, COALESCE($6, 'ko'), $7, NOW(), NOW())
      RETURNING id
    `;
        const qVals = [
            input.category_id,
            input.stem,
            input.explanation ?? null,
            input.difficulty ?? null,
            input.grade ?? 'general',
            input.language ?? 'ko',
            input.status,
        ];
        const qRes = await client.query(qSql, qVals);
        const questionId: number = qRes.rows[0].id;

        // 2) choices insert
        const cSql = `
      INSERT INTO quiz.choice (question_id, content, is_correct, order_no)
      VALUES ($1, $2, $3, $4)
    `;
        for (let i = 0; i < input.choices.length; i++) {
            const ch = input.choices[i];
            const content = (ch.content ?? '').trim();
            if (!content) throw new Error(`보기 #${i + 1} 내용이 비어 있습니다.`);
            const orderNo =
                ch.order_no != null
                    ? ch.order_no
                    : (i + 1); // 기본 순번: 1..n
            await client.query(cSql, [questionId, content, !!ch.is_correct, orderNo]);
        }

        await client.query('COMMIT');
        return { success: true, id: questionId };
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { }
        // 호출측에서 메시지 alert 처리하므로 false 반환
        return { success: false, id: 0 };
    } finally {
        client.release();
    }
}
