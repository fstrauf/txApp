import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// For Next.js, prevent multiple instances in development
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

const createDb = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
} 