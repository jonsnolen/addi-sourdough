import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  // Prefer direct Postgres URL; Vercel Postgres uses POSTGRES_URL for direct connection
  const connectionString = (
    process.env.DIRECT_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ""
  )
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is not set");
  }
  const isPostgres =
    connectionString.toLowerCase().startsWith("postgres://") ||
    connectionString.toLowerCase().startsWith("postgresql://");
  if (!isPostgres) {
    throw new Error(
      "DATABASE_URL must start with postgresql://. " +
        "In Supabase: Project Settings → Database → Connection string → URI (Transaction mode). " +
        "Replace [YOUR-PASSWORD] with your database password."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
