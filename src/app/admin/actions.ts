// app/admin/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createCategoryAction(formData: FormData) {
    const name = String(formData.get('name') ?? '').trim();
    const color = String(formData.get('color') ?? '').trim();
    const icon = String(formData.get('icon') ?? '').trim();

    if (!name) throw new Error('카테고리 이름은 필수입니다.');
    // await createCategory({ name, color: color || null, icon: icon || null });

    revalidatePath('/admin/categories/new');
    //return { ok: true };
}

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
