import { prisma } from "@/lib/db/prisma";
import type { QuizItem } from "./question.type";

export async function findQuickStartMcqItems(limit: number = 10): Promise<QuizItem[]> {
  const questions = await prisma.question.findMany({
    where: {
      type: "MCQ",
      status: "published",
    },
    include: {
      choices: {
        orderBy: { order_no: "asc" },
      },
    },
  });

  // 4지선다, 정답 1개, order_no 1~4 필터
  let filtered = questions.filter((q) => {
    if (q.choices.length !== 4) return false;
    const orderNos = new Set(q.choices.map((c) => c.order_no));
    if (orderNos.size !== 4) return false;
    const correctCount = q.choices.filter((c) => c.is_correct).length;
    if (correctCount !== 1) return false;
    return q.choices.every((c) => c.order_no != null && c.order_no >= 1 && c.order_no <= 4);
  });

  // 랜덤 셔플 후 limit 적용
  filtered = filtered.sort(() => Math.random() - 0.5).slice(0, Math.max(1, limit));

  return filtered.map((r) => {
    const correct = r.choices.find((c) => c.is_correct)!;
    return {
      id: String(r.id),
      question: r.stem ?? "",
      options: r.choices.map((c) => c.content),
      explanation: r.explanation ?? "",
      correctOrderNo: correct.order_no!,
    };
  });
}
