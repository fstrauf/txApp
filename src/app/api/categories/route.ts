import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories as dbCategories } from '@/db/schema';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic'; // Ensures the route is dynamic

// --- Zod Schema for POST request body ---
const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Category name cannot be empty.").max(100, "Category name too long"),
    // Add icon later if needed
});

// --- GET Handler ---
export async function GET(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        console.log(`[API /categories] Unauthorized GET attempt.`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`>>> [API /categories] Handling GET / for user: ${userId}`);

    try {
        const categories = await db
            .select({
                id: dbCategories.id,
                name: dbCategories.name,
                // icon: dbCategories.icon, // Include if needed later
            })
            .from(dbCategories)
            .where(eq(dbCategories.userId, userId))
            .orderBy(dbCategories.name); // Order alphabetically

        return NextResponse.json({ categories });

    } catch (error: any) {
        console.error(`[API /categories] Error fetching categories for user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        console.log(`[API /categories] Unauthorized POST attempt.`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`>>> [API /categories] Handling POST / for user: ${userId}`);

    try {
        const body = await request.json();
        const validation = createCategorySchema.safeParse(body);

        if (!validation.success) {
            console.log(`[API /categories] Invalid POST body for user ${userId}:`, validation.error.errors);
            return NextResponse.json({ error: 'Invalid category name', details: validation.error.errors }, { status: 400 });
        }

        const { name } = validation.data;

        // Check for existing category with the same name (case-insensitive)
        const existingCategory = await db.query.categories.findFirst({
            where: and(
                eq(dbCategories.userId, userId),
                // Use ilike for case-insensitive comparison if supported, otherwise lower()
                sql`lower(${dbCategories.name}) = ${name.toLowerCase()}`
            )
        });

        if (existingCategory) {
            console.log(`[API /categories] Category '${name}' already exists for user ${userId}`);
            return NextResponse.json({ error: `Category '${name}' already exists.` }, { status: 409 }); // 409 Conflict
        }

        // Create new category
        const newCategoryId = uuidv4();
        const [createdCategory] = await db
            .insert(dbCategories)
            .values({
                id: newCategoryId,
                name: name, // Store with original casing provided by user
                userId: userId,
                isDefault: false, // Manually added categories are not default
                // icon: null, // Set icon later if needed
            })
            .returning({
                 id: dbCategories.id,
                 name: dbCategories.name,
            });

        console.log(`[API /categories] Category '${name}' created for user ${userId} with ID: ${createdCategory.id}`);
        return NextResponse.json({ category: createdCategory }, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error(`[API /categories] Error creating category for user ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
} 