'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';

export type CategoryItem = { id: number; name: string; published: boolean | null }

export async function listCategories(): Promise<CategoryItem[]> {
  const rows = await prisma.category.findMany({
    select: { id: true, name: true, published: true },
    orderBy: [{ parent_id: { sort: "asc", nulls: "first" } }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    published: r.published ?? true,
  }));
}

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('카테고리 이름은 필수입니다.');

  revalidatePath('/admin/categories/new');
}

export async function updateQuestion(formData: FormData) {
  const id = Number(formData.get('id'));
  const type = formData.get('type') as string | null;
  const stem = formData.get('stem') as string | null;
  const explanation = formData.get('explanation') as string | null;
  const difficultyStr = formData.get('difficulty') as string | null;
  const grade = formData.get('grade') as string | null;
  const language = formData.get('language') as string | null;
  const status = formData.get('status') as string | null;
  const categoryIdStr = formData.get('category_id') as string | null;

  const difficulty = difficultyStr && difficultyStr.trim() !== ''
    ? Number(difficultyStr)
    : null;
  const categoryId = categoryIdStr && categoryIdStr.trim() !== ''
    ? Number(categoryIdStr)
    : null;

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid question ID');
  }

  const result = await prisma.question.update({
    where: { id: BigInt(id) },
    data: {
      type: type || null,
      stem: stem || null,
      explanation: explanation || null,
      difficulty,
      grade: grade || null,
      language: language || null,
      status: status || null,
      category_id: categoryId ? BigInt(categoryId) : null,
      updated_at: new Date(),
    },
  });

  if (!result) {
    throw new Error('Question not found');
  }

  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${id}`);
  redirect('/admin/questions/list');
}

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
  const skip = (page - 1) * pageSize;

  const where = {
    ...(query ? { stem: { contains: query, mode: 'insensitive' as const } } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.category_id ? { category_id: BigInt(input.category_id) } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      select: {
        id: true,
        stem: true,
        category_id: true,
        difficulty: true,
        grade: true,
        language: true,
        status: true,
        type: true,
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: items.map((q) => ({
      id: Number(q.id),
      stem: q.stem,
      category_id: q.category_id ? Number(q.category_id) : null,
      difficulty: q.difficulty,
      grade: q.grade,
      language: q.language,
      status: q.status,
      type: q.type,
    })),
    total,
    page,
    pageSize,
  };
}

type QuestionRow = {
  id: number;
  type: string | null;
  stem: string | null;
  explanation: string | null;
  difficulty: number | null;
  grade: string | null;
  language: string | null;
  status: string | null;
  category_id: number | null;
  subjective_answer: string | null;
  updated_at: string | null;
};

export async function getQuestion(id: number): Promise<QuestionRow | null> {
  const row = await prisma.question.findUnique({
    where: { id: BigInt(id) },
  });

  if (!row) return null;

  return {
    id: Number(row.id),
    type: row.type,
    stem: row.stem,
    explanation: row.explanation,
    difficulty: row.difficulty,
    grade: row.grade,
    language: row.language,
    status: row.status,
    category_id: row.category_id ? Number(row.category_id) : null,
    subjective_answer: row.subjective_answer,
    updated_at: row.updated_at
      ? row.updated_at.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ')
      : null,
  };
}
