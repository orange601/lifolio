// /core/repositroy/questions/quick.question.repo.ts
// 빠른시작

import { pool } from "@/lib/db/pool";
import type { QuizItem, QuestionWithChoices } from "./question.type";

/** 빠른시작: 카테고리/난이도 무시, MCQ 4지선다 랜덤 N문 */
export async function findQuickStartMcqItems(limit: number = 10): Promise<QuizItem[]> {
  const sql = `
    SELECT 
      q.id, q.stem, q.explanation,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', c.id,
          'content', c.content,
          'is_correct', c.is_correct,
          'order_no', c.order_no
        )
        ORDER BY c.order_no
      ) AS choices
    FROM quiz.question q
    JOIN quiz.choice c ON c.question_id = q.id
    WHERE q.type = 'MCQ'
      AND q.status = 'published'
    GROUP BY q.id
    HAVING 
      COUNT(c.id) = 4
      AND SUM(CASE WHEN c.is_correct THEN 1 ELSE 0 END) = 1
      AND BOOL_AND(c.order_no BETWEEN 1 AND 4)
    ORDER BY random()
    LIMIT $1
  `;
  const { rows } = await pool.query<QuestionWithChoices>(sql, [Math.max(1, limit)]);

  return rows.map((r) => {
    const sorted = [...(r as any).choices].sort(
      (a: any, b: any) => (a.order_no ?? Number.MAX_SAFE_INTEGER) - (b.order_no ?? Number.MAX_SAFE_INTEGER)
    );
    const correct = sorted.find((c: any) => c.is_correct === true);
    if (!correct) throw new Error(`Invalid data: no correct choice for question ${r.id}`);
    return {
      id: String((r as any).id),
      question: (r as any).stem,
      options: sorted.map((c: any) => c.content),
      explanation: (r as any).explanation,
      correctOrderNo: correct.order_no ?? (sorted.findIndex((c: any) => c.is_correct) + 1),
    };
  });
}