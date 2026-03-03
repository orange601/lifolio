import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var _prisma: PrismaClient | undefined; // eslint-disable-line no-var
}

function createPrismaClient() {
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: "quiz" },
  );
  return new PrismaClient({ adapter });
}

export const prisma = global._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}
