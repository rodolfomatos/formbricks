/**
 * Database client singleton — creates a PrismaClient with the PrismaPg
 * adapter and stores it on globalThis for hot-reload resilience.
 */
import { PrismaClient } from "./prisma";
import { createPrismaPgAdapter } from "./prisma-adapter";

const prismaClientSingleton = (): PrismaClient => {
  const { adapter } = createPrismaPgAdapter();

  return new PrismaClient({
    adapter,
    ...(process.env.DEBUG === "1" && {
      log: ["query", "info"],
    }),
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * Singleton PrismaClient — shared across the entire app to prevent connection
 * pool exhaustion. In non-production environments the instance is stored on
 * globalThis so hot-reloads don't create new connections.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
