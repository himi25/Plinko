import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

// Determine database URL based on environment
// Production: Use Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
// Development: Use local SQLite file
const isProduction = process.env.NODE_ENV === 'production';

const getDatabaseUrl = () => {
    if (isProduction && process.env.TURSO_DATABASE_URL) {
        return process.env.TURSO_DATABASE_URL;
    }
    // Local development: use absolute path to SQLite file
    return `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
};

const getAuthToken = () => {
    if (isProduction && process.env.TURSO_AUTH_TOKEN) {
        return process.env.TURSO_AUTH_TOKEN;
    }
    return undefined;
};

// Create Prisma adapter with config
const adapter = new PrismaLibSql({
    url: getDatabaseUrl(),
    authToken: getAuthToken(),
});

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!isProduction) {
    globalForPrisma.prisma = prisma;
}

export default prisma;
