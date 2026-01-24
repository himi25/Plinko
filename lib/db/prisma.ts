import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

// Use absolute path to ensure CLI and Next.js runtime use the same database
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

// Create Prisma adapter with config
const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
});

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
