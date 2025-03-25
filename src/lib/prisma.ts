// This file is kept for backwards compatibility to make the migration smoother
// It now re-exports the Drizzle db connection
import { db } from '../db';

export { db as prisma }; 