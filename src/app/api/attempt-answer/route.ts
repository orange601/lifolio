import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { pool } from "@/lib/db/pool";
import { createOne as createAttempt } from "@/core/repositroy/attempt/attempt.create.repo";
import { createMany as createAttemptAnswers } from "@/core/repositroy/attempt_answer/attempt.answer.create.repo";

type CreateAttemptAnswerBody = {
    mode: string;
    questionCnt: number;
    score?: number;  // 무시
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

function validateBody(body: any): { ok: true } | { ok: false; reason: string } {
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
    const client = await pool.connect();
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

        await client.query("BEGIN");

        // 1) attempt 저장
        const attempt = await createAttempt({
            userId: user.id,
            mode: body.mode,
            questionCnt: body.questionCnt,
            score: serverScore,
            totalTimeMs: body.totalTimeMs,
        });

        // 2) attempt_answer 저장
        await createAttemptAnswers(
            body.items.map((it) => ({
                attemptId: attempt.id,
                questionId: it.question_id ?? null,
                orderNo: it.order_no,
                selectedIdx: it.selected_idx,
                correctIdx: it.correct_idx,
                isCorrect: it.selected_idx !== null && it.selected_idx === it.correct_idx,
            }))
        );

        await client.query("COMMIT");

        return NextResponse.json({ attempt }, { status: 201 });
    } catch (e) {
        await client.query("ROLLBACK");
        console.error("POST /api/attempt-answer failed:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        client.release();
    }
}
