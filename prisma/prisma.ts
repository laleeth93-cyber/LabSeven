// --- BLOCK lib/prisma.ts OPEN ---
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prevent Next.js from exhausting database connections during hot-reloads
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// --- BLOCK lib/prisma.ts CLOSE ---