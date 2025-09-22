// /core/repositroy/questions/quick.question.repo.ts
// 빠른시작

import { pool } from "@/lib/db/pool";
import type { QuizItem, QuestionWithChoices } from "./question.type";

type ChoiceRow = {
  id: number;
  content: string;
  is_correct: boolean;
  order_no: number; // 1..4
};

type QuickRow = {
  id: number | string; // int8 대비
  stem: string;
  explanation: string | null;
  choices: ChoiceRow[];
};

/** 빠른시작: 카테고리/난이도 무시, MCQ 4지선다 랜덤 N문 */
export async function findQuickStartMcqItems(limit: number = 10): Promise<QuizItem[]> {
  const sql = `
    SELECT 
      q.id,
      q.stem,
      q.explanation,
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
    GROUP BY q.id, q.stem, q.explanation
    HAVING 
      COUNT(c.id) = 4
      AND COUNT(DISTINCT c.order_no) = 4   -- 중복 방지
      AND SUM(CASE WHEN c.is_correct THEN 1 ELSE 0 END) = 1
      AND BOOL_AND(c.order_no BETWEEN 1 AND 4)
    ORDER BY random()
    LIMIT $1;
  `;
  const { rows } = await pool.query<QuickRow>(sql, [Math.max(1, limit)]);

  return rows.map((r) => {
    // 이미 SQL에서 ORDER BY c.order_no로 JSON_AGG 했으므로 정렬 없이 바로 사용 가능
    const correct = r.choices.find((c) => c.is_correct)!;

    return {
      id: String(r.id),
      question: r.stem,
      options: r.choices.map((c) => c.content),
      explanation: r.explanation ?? "",
      correctOrderNo: correct.order_no, // 1-based
    };
  });
}