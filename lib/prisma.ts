import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
  prismaFailed?: boolean;
};

/**
 * Checks whether a valid PostgreSQL connection string is configured.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://');
}

/**
 * Lazily retrieves the PrismaClient instance if configured.
 * Prevents application startup crashes if DATABASE_URL is missing or invalid.
 */
export function getPrismaClient(): PrismaClient | null {
  if (!isDatabaseConfigured() || globalForPrisma.prismaFailed) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (err) {
      console.warn('PrismaClient failed to initialize. Falling back to server in-memory / Firestore mode:', err);
      globalForPrisma.prismaFailed = true;
      globalForPrisma.prisma = null;
      return null;
    }
  }

  return globalForPrisma.prisma;
}

/**
 * Backwards-compatible export that proxies to the lazy client
 * without throwing on initial module load.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
