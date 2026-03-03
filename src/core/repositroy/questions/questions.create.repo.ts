import { prisma } from "@/lib/db/prisma";

export type ChoiceInput = {
  content: string;
  is_correct: boolean;
  order_no: 1 | 2 | 3 | 4;
};

export type QuestionCoreInput = {
  category_id: number;
  type: "MCQ";
  stem: string;
  explanation?: string | null;
  difficulty: number;
  grade: string;
  language: string;
  status: "published" | "draft";
};

export type QuestionInput = {
  question: QuestionCoreInput;
  choices: ChoiceInput[];
};

export type SaveOptions = {
  onDuplicate?: "skip" | "replace";
  validate?: boolean;
};

export type SaveResult = {
  inserted: number;
  replaced: number;
  skipped: number;
  failed: number;
  errors: Array<{ stem: string; reason: string }>;
};

function validateItem(i: QuestionInput) {
  const errs: string[] = [];

  if (!i?.question) errs.push("question 누락");
  if (i.question.type !== "MCQ") errs.push("type은 'MCQ'만 허용");
  if (!i.question.stem?.trim()) errs.push("stem(문항)이 비어 있음");
  if (!Number.isFinite(i.question.category_id)) errs.push("category_id 누락");
  if (!Number.isFinite(i.question.difficulty)) errs.push("difficulty 누락");
  if (!i.question.language) errs.push("language 누락");
  if (!i.question.status) errs.push("status 누락");

  if (!Array.isArray(i.choices) || i.choices.length !== 4) {
    errs.push("choices는 4개여야 함");
  } else {
    const correctCount = i.choices.filter((c) => c.is_correct === true).length;
    if (correctCount !== 1) errs.push("정답은 정확히 1개여야 함");
    const orderNos = new Set(i.choices.map((c) => c.order_no));
    if (orderNos.size !== 4 || ![1, 2, 3, 4].every((n) => orderNos.has(n as 1 | 2 | 3 | 4))) {
      errs.push("order_no는 1..4 각각 한 번씩이어야 함");
    }
    if (i.choices.some((c) => !c.content?.trim())) errs.push("보기 content에 빈 값 존재");
  }

  return errs;
}

export async function saveGeneratedQuestions(
  data: QuestionInput[],
  opts: SaveOptions = {},
): Promise<SaveResult> {
  const onDuplicate = opts.onDuplicate ?? "skip";
  const doValidate = opts.validate ?? true;

  const result: SaveResult = { inserted: 0, replaced: 0, skipped: 0, failed: 0, errors: [] };

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of data) {
        const stemLabel = item?.question?.stem ?? "(unknown)";

        if (doValidate) {
          const errs = validateItem(item);
          if (errs.length) {
            result.failed++;
            result.errors.push({ stem: stemLabel, reason: errs.join("; ") });
            continue;
          }
        }

        const q = item.question;

        const existing = await tx.question.findFirst({
          where: {
            category_id: q.category_id,
            type: q.type,
            language: q.language,
            stem: q.stem,
          },
          select: { id: true },
        });

        if (existing && onDuplicate === "skip") {
          result.skipped++;
          continue;
        }

        let questionId: bigint;

        if (existing && onDuplicate === "replace") {
          await tx.question.update({
            where: { id: existing.id },
            data: {
              explanation: q.explanation ?? null,
              difficulty: q.difficulty,
              grade: q.grade,
              status: q.status,
              updated_at: new Date(),
            },
          });

          await tx.choice.deleteMany({
            where: { question_id: existing.id },
          });

          questionId = existing.id;
        } else if (!existing) {
          const created = await tx.question.create({
            data: {
              category_id: q.category_id,
              type: q.type,
              stem: q.stem,
              explanation: q.explanation ?? null,
              difficulty: q.difficulty,
              grade: q.grade,
              language: q.language,
              status: q.status,
            },
          });
          questionId = created.id;
        } else {
          result.failed++;
          result.errors.push({ stem: stemLabel, reason: "알 수 없는 중복 처리 상태" });
          continue;
        }

        await tx.choice.createMany({
          data: item.choices
            .sort((a, b) => a.order_no - b.order_no)
            .map((c) => ({
              question_id: questionId,
              content: c.content,
              is_correct: c.is_correct,
              order_no: c.order_no,
            })),
        });

        if (existing && onDuplicate === "replace") result.replaced++;
        else result.inserted++;
      }
    });

    return result;
  } catch (err: unknown) {
    result.failed += data.length - (result.inserted + result.replaced + result.skipped + result.failed);
    result.errors.push({ stem: "(transaction)", reason: String(err instanceof Error ? err.message : err) });
    return result;
  }
}
