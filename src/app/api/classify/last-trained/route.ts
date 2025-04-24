import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { embeddings } from '@/db/schema'; // Assuming your embeddings table schema is imported
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  console.log(`Fetching last trained timestamp for user ${userId}`);
  try {
    // Find the specific training embedding record for the user
    // We match both userId and the embedding id itself to the userId
    const result = await db
      .select({
        updatedAt: embeddings.updated_at,
      })
      .from(embeddings)
      .where(eq(embeddings.userId, userId))
      .orderBy(desc(embeddings.updated_at))
      .limit(1);

    const lastTrainedAt = result[0]?.updatedAt || null;

    if (lastTrainedAt) {
       console.log(`Found last trained timestamp for user ${userId}: ${lastTrainedAt}`);
    } else {
       console.log(`No training embedding record found for user ${userId}`);
    }
   
    return NextResponse.json({ lastTrainedAt });

  } catch (error) {
    console.error(`Error fetching last trained timestamp for user ${userId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error fetching timestamp' }, { status: 500 });
  }
} 