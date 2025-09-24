// src/app/api/attempt/[id]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";

type AttemptRow = {
    id: string;              // BIGSERIAL → string으로 올 수 있음
    user_id: string;
    mode: string;
    question_cnt: number;
    score: number;
    total_time_ms: number;
    created_at: string;      // timestamptz
};

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> } // ✅ params는 Promise
) {
    try {
        const { id: idStr } = await ctx.params; // 
        const id = Number(idStr);
        if (!Number.isFinite(id)) {
            return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
        }

        const sql = `
      SELECT id, user_id, mode, question_cnt, score, total_time_ms, created_at
      FROM quiz.attempt
      WHERE id = $1
      LIMIT 1
    `;
        const { rows } = await pool.query<AttemptRow>(sql, [id]);
        if (rows.length === 0) {
            return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        }

        const row = rows[0];

        const attempt = {
            id: Number(row.id),
            user_id: row.user_id,
            mode: row.mode,
            question_cnt: row.question_cnt,
            score: row.score,
            total_time_ms: row.total_time_ms,
            created_at: row.created_at,
        };

        return NextResponse.json({ attempt }, { status: 200 });
    } catch (e) {
        console.error("GET /api/attempt/[id] error:", e);
        return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }
}
