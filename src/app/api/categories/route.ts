import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { findUserByEmail, findCategoryByNameAndUserId, createId } from '@/db/utils';
import { asc, eq, ilike, or } from 'drizzle-orm';

// GET - Fetch all categories for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userCategories = await db
      .select()
      .from(categories)
      .where(or(eq(categories.userId, user.id), eq(categories.isDefault, true)))
      .orderBy(asc(categories.name));
    
    return NextResponse.json({ categories: userCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email!);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { name, icon } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    // Check if category with same name already exists for this user
    const existingCategory = await findCategoryByNameAndUserId(name, user.id);
    
    if (existingCategory) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    }
    
    const newCategory = {
      id: createId(),
      name,
      icon: icon || null,
      userId: user.id,
      isDefault: false,
    };
    
    const [category] = await db.insert(categories).values(newCategory).returning();
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    );
  }
} 