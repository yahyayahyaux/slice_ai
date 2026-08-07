/**
 * Prisma database client instantiation.
 *
 * In production, point DATABASE_URL at a PostgreSQL/MySQL instance and run:
 *   npx prisma migrate dev
 *   npx prisma generate
 *
 * This module detects whether @prisma/client is available and a DATABASE_URL
 * is set. If both are present it returns the real Prisma client; otherwise it
 * gracefully falls back to the built-in file-backed adapter (lib/db.ts), so
 * the app runs fully offline and keyless.
 */
export interface DatabaseAdapter {
  kind: "prisma" | "file";
  prisma?: unknown;
}

let cached: DatabaseAdapter | undefined;

export function getDb(): DatabaseAdapter {
  if (cached) return cached;
  if (process.env.DATABASE_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => unknown };
      cached = { kind: "prisma", prisma: new PrismaClient() };
      return cached;
    } catch {
      // @prisma/client not generated — fall through to file adapter
    }
  }
  cached = { kind: "file" };
  return cached;
}

export const prisma = getDb();
