'use server';

import { pool } from '@/lib/db/pool';


export type CategoryItem = { id: number; name: string; published: boolean | null }

export async function listCategories(): Promise<CategoryItem[]> {
    const client = await pool.connect()
    try {
        const { rows } = await client.query(
            `
            SELECT id, name, COALESCE(published, true) AS published
            FROM quiz.category
            ORDER BY parent_id NULLS FIRST, id ASC
            `
        )
        return rows
    } finally {
        client.release()
    }
}

// --- Quiz Set ---
export type QuizSetItem = { id: number; title: string; status: 'draft' | 'published' | 'archived'; is_random: boolean }


export async function listQuizSets(): Promise<QuizSetItem[]> {
    const client = await pool.connect()
    try {
        const { rows } = await client.query(
            `SELECT id, title, status, COALESCE(is_random,false) AS is_random
FROM quiz.quiz_set
ORDER BY id DESC`
        )
        return rows
    } finally {
        client.release()
    }
}


export async function addQuestionToQuizSet(input: { quiz_id: number; question_id: number; order_no?: number | null; points?: number | null }): Promise<void> {
    const client = await pool.connect()
    try {
        const sql = `
INSERT INTO quiz.quiz_set_question (quiz_id, question_id, order_no, points)
VALUES ($1, $2, $3, $4)
ON CONFLICT (quiz_id, question_id) DO UPDATE
SET order_no = EXCLUDED.order_no,
points = EXCLUDED.points
`
        await client.query(sql, [
            input.quiz_id,
            input.question_id,
            input.order_no ?? null,
            input.points ?? 1,
        ])
    } finally {
        client.release()
    }
}

export type SaveQuestionInput = {
    type: 'MCQ' | 'SUBJECTIVE'
    stem: string
    explanation?: string | null
    difficulty?: number | null
    grade?: string | null
    language?: string | null
    status: 'published' | 'draft'
    category_id: number
    subjective_answer?: string | null // only for SUBJECTIVE
}

export async function saveQuestion(
    input: SaveQuestionInput
): Promise<{ success: boolean; id: number }> {
    const client = await pool.connect()
    try {
        // Basic guard
        if (!input.stem?.trim()) throw new Error('문제를 입력하세요 (stem).')
        if (!input.category_id) throw new Error('카테고리를 선택하세요.')
        if (input.type === 'SUBJECTIVE' && !input.subjective_answer?.trim()) {
            throw new Error('주관식 정답을 입력하세요.')
        }

        const sql = `
      INSERT INTO quiz.question
        (category_id, "type", stem, subjective_answer, explanation, difficulty, grade, language, status, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'ko'), $9, NOW(), NOW())
      RETURNING id
    `
        const values = [
            input.category_id,
            input.type,
            input.stem,
            input.type === 'SUBJECTIVE' ? input.subjective_answer : null,
            input.explanation ?? null,
            input.difficulty ?? null,
            input.grade ?? 'general',
            input.language ?? 'ko',
            input.status,
        ]
        const { rows } = await client.query(sql, values)
        return { success: true, id: rows[0].id as number }
    } catch (err: any) {
        return { success: false, id: 0 };
    } finally {
        client.release()
    }
}