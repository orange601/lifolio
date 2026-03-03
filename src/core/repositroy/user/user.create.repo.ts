import { prisma } from "@/lib/db/prisma";

export type AppUser = {
  id: number;
  clerk_user_id: string;
  username: string | null;
  created_at: Date;
  last_active_at: Date | null;
};

export async function createOne(clerkUserId: string, username?: string): Promise<AppUser> {
  const row = await prisma.app_user.upsert({
    where: { clerk_user_id: clerkUserId },
    update: {},
    create: {
      clerk_user_id: clerkUserId,
      username: username ?? null,
    },
  });

  return {
    id: Number(row.id),
    clerk_user_id: row.clerk_user_id,
    username: row.username,
    created_at: row.created_at,
    last_active_at: row.last_active_at,
  };
}

export async function findAppUserByClerkId(clerkUserId: string): Promise<AppUser | null> {
  const row = await prisma.app_user.findUnique({
    where: { clerk_user_id: clerkUserId },
  });

  if (!row) return null;

  return {
    id: Number(row.id),
    clerk_user_id: row.clerk_user_id,
    username: row.username,
    created_at: row.created_at,
    last_active_at: row.last_active_at,
  };
}
