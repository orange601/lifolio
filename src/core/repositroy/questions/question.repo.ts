import { prisma } from "@/lib/db/prisma";
import { QuestionWithChoices, QuizItem } from "./question.type";

type FindOptions = {
  limit?: number;
  random?: boolean;
};

export async function findAllMcq(
  categoryId: number,
  difficulty?: number,
  opts: FindOptions = {},
): Promise<QuestionWithChoices[]> {
  const limitRaw = Number.isFinite(opts.limit as number) ? Number(opts.limit) : 10;
  const limit = Math.max(1, limitRaw);

  const questions = await prisma.question.findMany({
    where: {
      category_id: categoryId,
      ...(difficulty != null ? { difficulty } : {}),
      type: "MCQ",
      status: "published",
    },
    include: {
      choices: {
        orderBy: { order_no: "asc" },
      },
    },
    ...(opts.random ? {} : { orderBy: { created_at: "desc" } }),
  });

  // 4지선다, 정답 1개, order_no 1~4 필터
  let filtered = questions.filter((q) => {
    if (q.choices.length !== 4) return false;
    const correctCount = q.choices.filter((c) => c.is_correct).length;
    if (correctCount !== 1) return false;
    return q.choices.every((c) => c.order_no != null && c.order_no >= 1 && c.order_no <= 4);
  });

  if (opts.random) {
    filtered = filtered.sort(() => Math.random() - 0.5);
  }

  return filtered.slice(0, limit).map((q) => ({
    id: String(q.id),
    category_id: Number(q.category_id),
    type: q.type ?? "MCQ",
    stem: q.stem ?? "",
    explanation: q.explanation ?? null,
    difficulty: q.difficulty ?? 0,
    grade: q.grade ?? "",
    language: q.language ?? null,
    status: q.status ?? "draft",
    created_by: q.created_by ?? null,
    created_at: q.created_at?.toISOString() ?? "",
    updated_at: q.updated_at?.toISOString() ?? null,
    choices: q.choices.map((c) => ({
      id: String(c.id),
      content: c.content,
      is_correct: c.is_correct,
      order_no: c.order_no,
    })),
  }));
}

export async function findAllQuizItems(
  categoryId: number,
  difficulty?: number,
  opts: FindOptions = {},
): Promise<QuizItem[]> {
  const rows = await findAllMcq(categoryId, difficulty, opts);

  return rows.map((r) => {
    const sorted = [...r.choices].sort(
      (a, b) => (a.order_no ?? Number.MAX_SAFE_INTEGER) - (b.order_no ?? Number.MAX_SAFE_INTEGER),
    );

    if (sorted.length !== 4) {
      throw new Error(`Invalid MCQ: question ${r.id} must have exactly 4 choices`);
    }
    const correctIndex = sorted.findIndex((c) => c.is_correct === true);
    if (correctIndex < 0) {
      throw new Error(`Invalid data: no correct choice for question ${r.id}`);
    }

    const options = sorted.map((c) => c.content);
    const correctOrderNo = sorted[correctIndex].order_no ?? (correctIndex + 1);

    return {
      id: String(r.id),
      question: r.stem,
      options,
      explanation: r.explanation,
      correctOrderNo,
    };
  });
}

export async function findQuestionsWithChoicesByCategoryAndDifficulty(
  categoryId: number,
  difficulty?: number,
): Promise<QuestionWithChoices[]> {
  const questions = await prisma.question.findMany({
    where: {
      category_id: categoryId,
      ...(difficulty != null ? { difficulty } : {}),
    },
    include: {
      choices: {
        orderBy: { order_no: { sort: "asc", nulls: "last" } },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return questions.map((q) => ({
    id: String(q.id),
    category_id: Number(q.category_id),
    type: q.type ?? "MCQ",
    stem: q.stem ?? "",
    explanation: q.explanation ?? null,
    difficulty: q.difficulty ?? 0,
    grade: q.grade ?? "",
    language: q.language ?? null,
    status: q.status ?? "draft",
    created_by: q.created_by ?? null,
    created_at: q.created_at?.toISOString() ?? "",
    updated_at: q.updated_at?.toISOString() ?? null,
    choices: q.choices.map((c) => ({
      id: String(c.id),
      content: c.content,
      is_correct: c.is_correct,
      order_no: c.order_no,
    })),
  }));
}

export async function findQuizItems(
  categoryId: number,
  difficulty: number,
): Promise<QuizItem[]> {
  const rows = await findQuestionsWithChoicesByCategoryAndDifficulty(categoryId, difficulty);

  return rows.map((r) => {
    const sorted = [...r.choices].sort(
      (a, b) => (a.order_no ?? Number.MAX_SAFE_INTEGER) - (b.order_no ?? Number.MAX_SAFE_INTEGER),
    );
    const options = sorted.map((c) => c.content);
    const correctChoice = sorted.find((c) => c.is_correct === true);
    const correctOrderNo = correctChoice?.order_no ?? 0;
    return {
      id: String(r.id),
      question: r.stem,
      options,
      explanation: r.explanation,
      correctOrderNo,
    };
  });
}
