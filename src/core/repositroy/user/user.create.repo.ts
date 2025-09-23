import { pool } from "@/lib/db/pool";
import { toNum } from "@/utils/number";

export type AppUserRowRaw = {
    id: string;              // BIGSERIAL → 문자열로 반환됨
    clerk_user_id: string;   // UUID
    username: string | null;
    created_at: Date;
    last_active_at: Date | null;
};

export type AppUser = {
    id: number;
    clerk_user_id: string;
    username: string | null;
    created_at: Date;
    last_active_at: Date | null;
};

const INSERT_ONE = `
  INSERT INTO quiz.app_user (clerk_user_id, username)
  VALUES ($1, $2)
  ON CONFLICT (clerk_user_id) DO NOTHING
  RETURNING id, clerk_user_id, username, created_at, last_active_at
`
export async function createOne(clerkUserId: string, username?: string): Promise<AppUser> {
    const results = await pool.query<AppUserRowRaw>(INSERT_ONE, [clerkUserId, username]);
    const row = results.rows[0];
    return {
        id: toNum(row.id)!,
        clerk_user_id: row.clerk_user_id,
        username: row.username,
        created_at: row.created_at,
        last_active_at: row.last_active_at,
    };
}


/**
 * Clerk userId 로 사용자 찾기
 */
export async function findAppUserByClerkId(clerkUserId: string): Promise<AppUser | null> {
    const sql = `
    SELECT id, clerk_user_id, username, created_at, last_active_at
    FROM quiz.app_user
    WHERE clerk_user_id = $1
    LIMIT 1
  `;
    const { rows } = await pool.query<AppUserRowRaw>(sql, [clerkUserId]);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        id: toNum(row.id)!,
        clerk_user_id: row.clerk_user_id,
        username: row.username,
        created_at: row.created_at,
        last_active_at: row.last_active_at,
    };
}