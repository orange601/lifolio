import { NextResponse } from "next/server";
import { createOne } from "@/core/repositroy/attempt/attempt.create.repo";

// API 요청 body 타입
type CreateAttemptBody = {
    userId: string;
    mode: string;
    questionCnt: number;
    score: number;
    totalTimeMs: number;
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CreateAttemptBody;

        // 필수값 검증
        if (!body.userId || !body.mode || !body.questionCnt) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const attempt = await createOne({
            userId: body.userId,
            mode: body.mode,
            questionCnt: body.questionCnt,
            score: body.score,
            totalTimeMs: body.totalTimeMs,
        });

        return NextResponse.json({ attempt }, { status: 201 });
    } catch (e) {
        console.error("POST /api/attempt failed:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
