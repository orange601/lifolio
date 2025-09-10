import { pool } from "@/lib/db/pool";
import { FindAllCategories, CategoryRowRaw } from "@/core/repositroy/categories/category.type";
import { toNum } from '@/utils/number'

/**
 * category 전체 조회
 */
export async function findAllCategories(
): Promise<FindAllCategories[]> {
    const sql = `
        SELECT id, parent_id, "name", slug, created_at, description
        FROM quiz.category
        ORDER BY id ASC
  `;
    const { rows } = await pool.query<CategoryRowRaw>(sql); // 예외 throw 발생, try catch 불필요
    return rows.map((row) => ({
        id: toNum(row.id)!,
        parent_id: toNum(row.parent_id),
        name: row.name,
        slug: row.slug,
        created_at: row.created_at,
        description: row.description
    }));
}
