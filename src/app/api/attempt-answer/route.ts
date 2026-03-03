import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

type CreateAttemptAnswerBody = {
  mode: string;
  questionCnt: number;
  score?: number;
  totalTimeMs: number;
  items: Array<{
    order_no: number;
    question_id?: number | null;
    selected_idx: number | null;
    correct_idx: number;
  }>;
};

function isFiniteNonNegInt(n: unknown) {
  return Number.isFinite(n) && typeof n === "number" && n >= 0 && Number.isInteger(n);
}

function validateBody(body: unknown): { ok: true } | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "INVALID_PAYLOAD" };

  const { mode, questionCnt, totalTimeMs, items } = body as CreateAttemptAnswerBody;

  if (!mode || typeof mode !== "string") return { ok: false, reason: "INVALID_MODE" };
  if (!isFiniteNonNegInt(questionCnt) || questionCnt <= 0) return { ok: false, reason: "INVALID_QUESTION_CNT" };
  if (!isFiniteNonNegInt(totalTimeMs)) return { ok: false, reason: "INVALID_TOTAL_TIME" };
  if (!Array.isArray(items) || items.length === 0) return { ok: false, reason: "ITEMS_REQUIRED" };
  if (items.length !== questionCnt) return { ok: false, reason: "ITEMS_LENGTH_MISMATCH" };

  for (const it of items) {
    if (!isFiniteNonNegInt(it.order_no)) return { ok: false, reason: "INVALID_ORDER_NO" };
    if (!(it.selected_idx === null || isFiniteNonNegInt(it.selected_idx)))
      return { ok: false, reason: "INVALID_SELECTED_IDX" };
    if (!isFiniteNonNegInt(it.correct_idx)) return { ok: false, reason: "INVALID_CORRECT_IDX" };
  }

  return { ok: true };
}

function recomputeScore(items: CreateAttemptAnswerBody["items"]) {
  return items.reduce((acc, it) => {
    return acc + (it.selected_idx !== null && it.selected_idx === it.correct_idx ? 1 : 0);
  }, 0);
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json()) as CreateAttemptAnswerBody;
    const v = validateBody(body);
    if (!v.ok) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    const serverScore = recomputeScore(body.items);
    if (serverScore < 0 || serverScore > body.questionCnt) {
      return NextResponse.json({ error: "INVALID_SCORE_RECOMPUTE" }, { status: 400 });
    }

    const attempt = await prisma.$transaction(async (tx) => {
      const attemptRow = await tx.attempt.create({
        data: {
          user_id: user.id,
          mode: body.mode,
          question_cnt: body.questionCnt,
          score: serverScore,
          total_time_ms: body.totalTimeMs,
        },
      });

      await tx.attempt_answer.createMany({
        data: body.items.map((it) => ({
          attempt_id: attemptRow.id,
          question_id: it.question_id != null ? BigInt(it.question_id) : null,
          order_no: it.order_no,
          selected_idx: it.selected_idx,
          correct_idx: it.correct_idx,
          is_correct: it.selected_idx !== null && it.selected_idx === it.correct_idx,
        })),
      });

      return {
        id: Number(attemptRow.id),
        user_id: attemptRow.user_id,
        mode: attemptRow.mode,
        question_cnt: attemptRow.question_cnt,
        score: attemptRow.score,
        total_time_ms: attemptRow.total_time_ms,
        created_at: attemptRow.created_at,
      };
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (e) {
    console.error("POST /api/attempt-answer failed:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
