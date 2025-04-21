import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

export async function GET(request: Request) {
  // Get session using NextAuth
  const session = await getServerSession(authConfig);
  
  // Check for valid session and user ID
  if (!session?.user?.id) {
    console.log("[API /bank-accounts] Unauthorized access attempt.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  console.log(`>>> [API /bank-accounts] Handling GET / for user: ${userId}`);

  try {
    const accounts = await db
      .select({
        id: bankAccounts.id,
        name: bankAccounts.name,
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(bankAccounts.name);

    return NextResponse.json({ bankAccounts: accounts });
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

// Zod schema for creating a bank account
const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  // Add type if needed, defaulting for now
  // type: z.string().optional().default('checking'), 
});

export async function POST(request: NextRequest) {
  // Authentication Check
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const validation = createAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const { name } = validation.data;
    console.log(`>>> [API /bank-accounts] Handling POST / Creating account '${name}' for user: ${userId}`);

    const newAccount = {
      id: uuidv4(), // Generate new ID
      userId: userId,
      name: name,
      type: 'checking', // Default type for now
      balance: '0', // Default balance
      // Add other necessary defaults if schema requires them
    };

    // Insert into database
    const inserted = await db.insert(bankAccounts).values(newAccount).returning();

    if (!inserted || inserted.length === 0) {
        throw new Error("Failed to insert bank account into database.");
    }

    console.log(`>>> [API /bank-accounts] Account created successfully with ID: ${inserted[0].id}`);
    // Return the newly created account (especially the ID)
    return NextResponse.json({ bankAccount: inserted[0] }, { status: 201 }); 

  } catch (error: any) {
    console.error('Failed to create bank account:', error);
    // Handle potential DB errors like unique constraints if needed
    return NextResponse.json({ error: error.message || 'Failed to create bank account' }, { status: 500 });
  }
} 