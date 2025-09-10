export const runtime = "nodejs"; // pg는 Edge 불가

import { NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";

import { findAllCategories } from '@/core/repositroy/categories/category.repo';

export async function GET() {
    try {
        const rows = await findAllCategories();
        return NextResponse.json(rows);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "DB_QUERY_FAILED" }, { status: 500 });
    }
}
