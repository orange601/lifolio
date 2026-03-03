import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
    }

    const row = await prisma.attempt.findUnique({
      where: { id: BigInt(id) },
    });

    if (!row) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const attempt = {
      id: Number(row.id),
      user_id: row.user_id,
      mode: row.mode,
      question_cnt: row.question_cnt,
      score: row.score,
      total_time_ms: row.total_time_ms,
      created_at: row.created_at.toISOString(),
    };

    return NextResponse.json({ attempt }, { status: 200 });
  } catch (e) {
    console.error("GET /api/attempt/[id] error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
