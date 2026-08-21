import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const prisma =
  hasDatabaseUrl
    ? globalForPrisma.__tactixPrisma ??
      new PrismaClient({
        log: ['error', 'warn'],
      })
    : null;

if (hasDatabaseUrl && process.env.NODE_ENV !== 'production') {
  globalForPrisma.__tactixPrisma = prisma;
}