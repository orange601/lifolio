// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { pool } from '@/lib/db/pool';
import { redirect } from 'next/navigation';

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

export async function createCategoryAction(formData: FormData) {
    const name = String(formData.get('name') ?? '').trim();
    const color = String(formData.get('color') ?? '').trim();
    const icon = String(formData.get('icon') ?? '').trim();

    if (!name) throw new Error('카테고리 이름은 필수입니다.');
    // await createCategory({ name, color: color || null, icon: icon || null });

    revalidatePath('/admin/categories/new');
    //return { ok: true };
}

/**
 * @deprecated 사용 안하는것같음
 */
export async function updateQuestionAction(formData: FormData) {
    const id = String(formData.get('id'));
    const stem = String(formData.get('stem') ?? '');
    const explanation = String(formData.get('explanation') ?? '');
    const difficulty = Number(formData.get('difficulty') ?? 3);
    const status = String(formData.get('status') ?? 'draft');
    const language = String(formData.get('language') ?? 'ko');
    const type = String(formData.get('type') ?? 'MCQ');

    // choices[]는 JSON 문자열로 받도록
    const choicesJson = String(formData.get('choices') ?? '[]');
    const choices = JSON.parse(choicesJson) as Array<{
        id?: string;
        content: string;
        is_correct: boolean;
        order_no: number | null;
    }>;

    // await updateQuestionWithChoices({
    //     id, stem, explanation: explanation || null,
    //     difficulty, status, language, type,
    //     choices,
    // });

    revalidatePath(`/admin/questions/${id}`);
    //return { ok: true };
}


export async function updateQuestion(formData: FormData) {
    const client = await pool.connect();

    try {
        // 1. FormData에서 값 추출
        const id = Number(formData.get('id'));
        const type = formData.get('type') as string | null;
        const stem = formData.get('stem') as string | null;
        const explanation = formData.get('explanation') as string | null;
        const difficultyStr = formData.get('difficulty') as string | null;
        const grade = formData.get('grade') as string | null;
        const language = formData.get('language') as string | null;
        const status = formData.get('status') as string | null;
        const categoryIdStr = formData.get('category_id') as string | null;

        // 2. 숫자 변환 (빈 문자열은 null로)
        const difficulty = difficultyStr && difficultyStr.trim() !== ''
            ? Number(difficultyStr)
            : null;
        const categoryId = categoryIdStr && categoryIdStr.trim() !== ''
            ? Number(categoryIdStr)
            : null;

        // 3. ID 유효성 검사
        if (!Number.isFinite(id) || id <= 0) {
            throw new Error('Invalid question ID');
        }

        // 4. UPDATE 쿼리 실행
        const result = await client.query(
            `
            UPDATE quiz.question
            SET
                "type" = $2,
                stem = $3,
                explanation = $4,
                difficulty = $5,
                grade = $6,
                "language" = $7,
                status = $8,
                category_id = $9,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id
            `,
            [
                id,
                type || null,
                stem || null,
                explanation || null,
                difficulty,
                grade || null,
                language || null,
                status || null,
                categoryId
            ]
        );

        // 5. 업데이트 성공 여부 확인
        if (result.rowCount === 0) {
            throw new Error('Question not found');
        }

    } catch (error) {
        console.error('Failed to update question:', error);
        throw error;
    } finally {
        client.release();
    }

    // 6. 캐시 재검증 및 리다이렉트
    revalidatePath('/admin/questions');
    revalidatePath(`/admin/questions/${formData.get('id')}`);
    redirect('/admin/questions/list');
}


/** 문항 검색 + 페이지네이션 (stem ILIKE) */
export async function searchQuestions(input: {
    query?: string;
    page?: number;
    pageSize?: number;
    type?: string;
    category_id?: number;
    status?: string;
}) {
    const query = (input.query ?? '').trim();
    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(input.pageSize ?? 20)));
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];

    // 기존 키워드 검색
    if (query) {
        params.push(`%${query}%`);
        where.push(`q.stem ILIKE $${params.length}`);
    }
    // type 필터 추가
    if (input.type) {
        params.push(input.type);
        where.push(`q.type = $${params.length}`);
    }
    // category_id 필터 추가
    if (input.category_id) {
        params.push(input.category_id);
        where.push(`q.category_id = $${params.length}`);
    }
    // status 필터 추가
    if (input.status) {
        params.push(input.status);
        where.push(`q.status = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const client = await pool.connect();
    try {
        const totalRow = await client.query(
            `SELECT COUNT(*) FROM quiz.question q ${whereSql}`,
            params
        );
        const total = Number(totalRow.rows[0].count ?? 0);

        params.push(pageSize, offset);
        const data = await client.query(
            `
      SELECT q.id, q.stem, q.category_id, q.difficulty, q.grade, q.language, q.status, q.type
      FROM quiz.question q
      ${whereSql}
      ORDER BY q.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
            params
        );

        return { items: data.rows, total, page, pageSize };
    } finally {
        client.release();
    }
}

type QuestionRow = {
    id: number;
    type: string | null;
    stem: string | null;
    explanation: string | null;
    difficulty: number | null; // int2
    grade: string | null;
    language: string | null;
    status: string | null;
    category_id: number | null;
    subjective_answer: string | null;
    updated_at: string | null; // formatted
};
export async function getQuestion(id: number): Promise<QuestionRow | null> {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `
      SELECT
        q.id,
        q."type",
        q.stem,
        q.explanation,
        q.difficulty,
        q.grade,
        q."language",
        q.status,
        q.category_id,
        q.subjective_answer,
        to_char(q.updated_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:ss') AS updated_at
      FROM quiz.question q
      WHERE q.id = $1
      `,
            [id]
        );
        if (res.rowCount === 0) return null;
        return res.rows[0] as QuestionRow;
    } finally {
        client.release();
    }
}