'use server';

import { pool } from '@/lib/db/pool';

/** 세트 저장(정적 세트 + 매핑 벌크 삽입) */
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const ins = await client.query(
            `
      INSERT INTO quiz.quiz_set (title, description, is_random, status)
      VALUES ($1, $2, COALESCE($3,false), 'draft')
      RETURNING id
      `,
            [input.title.trim(), input.description ?? null, !!input.is_random]
        );
        const quizId = Number(ins.rows[0].id);

        const values: any[] = [];
        const tuples = input.items.map((it, i) => {
            const base = i * 4;
            values.push(quizId, it.question_id, it.order_no ?? i + 1, it.points ?? 1);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        }).join(',');

        await client.query(
            `
      INSERT INTO quiz.quiz_set_question (quiz_id, question_id, order_no, points)
      VALUES ${tuples}
      `,
            values
        );

        await client.query('COMMIT');
        return { id: quizId };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
