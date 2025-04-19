import { Hono } from 'hono';
import type { Context } from 'hono';
import { db } from '../../db'; // Adjust path as necessary
import { bankAccounts } from '../../db/schema'; // Adjust path as necessary
import { eq } from 'drizzle-orm';

const bankAccountsApi = new Hono();

// GET /api/bank-accounts
bankAccountsApi.get('/', async (c: Context) => {
  const payload = c.get('jwtPayload');
  const userId = payload.id;

  try {
    const accounts = await db
      .select({
        id: bankAccounts.id,
        name: bankAccounts.name,
        // Add other fields if needed by the frontend
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(bankAccounts.name); // Optional: order by name

    return c.json({ bankAccounts: accounts });
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error);
    return c.json({ error: 'Failed to fetch bank accounts' }, 500);
  }
});

export default bankAccountsApi; 