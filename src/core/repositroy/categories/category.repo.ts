import { prisma } from "@/lib/db/prisma";
import { FindAllCategories } from "@/core/repositroy/categories/category.type";

export async function findAllCategories(): Promise<FindAllCategories[]> {
  const rows = await prisma.category.findMany({
    where: { published: true },
    orderBy: { id: "asc" },
    select: {
      id: true,
      parent_id: true,
      name: true,
      slug: true,
      created_at: true,
      description: true,
    },
  });

  return rows.map((row) => ({
    id: Number(row.id),
    parent_id: row.parent_id ? Number(row.parent_id) : null,
    name: row.name,
    slug: row.slug,
    created_at: row.created_at?.toISOString() ?? null,
    description: row.description,
  }));
}
