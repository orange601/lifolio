import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { findAttemptReview } from "@/core/repositroy/attempt_answer/attempt.review.repo";

type Params = { params: { attemptId: string } };

export async function GET(_req: Request, { params }: Params) {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const id = Number(params.attemptId);
    if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "INVALID_ATTEMPT_ID" }, { status: 400 });
    }

    const review = await findAttemptReview(id, user.id);
    if (!review) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json(review, { status: 200 });
}
