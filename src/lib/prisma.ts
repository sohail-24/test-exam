import { PrismaClient } from '@prisma/client';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createMockPrisma(): PrismaClient {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d?: { data?: Record<string, unknown> }) => ({
      id: `mock-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(d?.data ?? {}),
    }),
    update: async (d?: { data?: Record<string, unknown> }) => ({
      ...(d?.data ?? {}),
    }),
    upsert: async (d?: { create?: Record<string, unknown> }) => ({
      id: `mock-${Date.now()}`,
      ...(d?.create ?? {}),
    }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    updateMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
    count: async () => 0,
    aggregate: async () => ({}),
    groupBy: async () => [],
  };
  return new Proxy(
    {
      $connect: async () => {},
      $disconnect: async () => {},
      $transaction: async (fn: unknown) =>
        typeof fn === 'function' ? fn(createMockPrisma()) : [],
    },
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof typeof target];
        }
        return noOp;
      },
    },
  ) as unknown as PrismaClient;
}

let prismaInstance: PrismaClient;

if (!process.env.DATABASE_URL) {
  console.warn('[AI Studio] DATABASE_URL not set — using mock');
  prismaInstance = createMockPrisma();
} else {
  try {
    prismaInstance =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
  } catch {
    console.warn('[AI Studio] Database not connected — using mock');
    prismaInstance = createMockPrisma();
  }
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

