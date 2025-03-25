// Migrations script for Drizzle
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to database directly since we can't import TypeScript
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

console.log('Using connection string from environment variables');

const pool = new Pool({ connectionString });
const db = drizzle(pool);

console.log('Running migrations...');

migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') })
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migrations failed:', err);
    process.exit(1);
  }); 