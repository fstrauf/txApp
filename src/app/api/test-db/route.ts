import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const create = url.searchParams.get('create') === 'true';
  const email = url.searchParams.get('email');
  const password = url.searchParams.get('password');

  try {
    // If create flag is true and email/password are provided, create a test user
    if (create && email && password) {
      return await createOrUpdateUser(email, password);
    }

    // Otherwise just return database info
    const result = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(users)
    .execute();
    
    const userCount = result[0]?.count || 0;
    
    // Return success response with user count
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      dbUrl: process.env.DATABASE_URL?.slice(0, 30) + '...' // Only show part of the URL for security
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to create or update a user
async function createOrUpdateUser(email: string, password: string) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    if (existingUser) {
      // Update user password
      await db.update(users)
        .set({ 
          password: hashedPassword,
          updated_at: new Date()
        })
        .where(eq(users.id, existingUser.id));
      
      return NextResponse.json({
        success: true,
        message: `User ${email} password updated successfully`,
        id: existingUser.id
      });
    } else {
      // Create new user
      const id = uuid();
      const name = email.split('@')[0];
      
      await db.insert(users).values({
        id,
        name,
        email,
        password: hashedPassword,
        email_verified: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: `User ${email} created successfully`,
        id
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 