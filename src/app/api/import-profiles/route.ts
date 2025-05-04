import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { csvImportProfiles } from '@/db/schema';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

// --- Zod Schema for Profile Creation ---
const createProfileConfigSchema = z.object({
    mappings: z.record(z.enum(['date', 'amount', 'description', 'currency', 'category', 'none'])),
    dateFormat: z.string().min(1, 'Date format is required'),
    amountFormat: z.enum(['standard', 'negate', 'sign_column']),
    signColumn: z.string().optional(),
    skipRows: z.number().int().min(0).default(0),
    delimiter: z.string().optional(),
}).refine(data => data.amountFormat !== 'sign_column' || (data.amountFormat === 'sign_column' && data.signColumn), {
  message: "Sign column mapping is required when amount format is 'sign_column'",
  path: ["signColumn"], // Point error to signColumn if needed
});

const createProfileSchema = z.object({
    name: z.string().min(1, "Profile name cannot be empty."),
    config: createProfileConfigSchema,
});

export type CsvImportProfile = {
    id: string;
    name: string;
    config: z.infer<typeof createProfileConfigSchema>;
};

// --- GET Handler ---
export async function GET(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const profiles = await db.select({
                id: csvImportProfiles.id,
                name: csvImportProfiles.name,
                config: csvImportProfiles.config,
            })
            .from(csvImportProfiles)
            .where(eq(csvImportProfiles.userId, userId))
            .orderBy(csvImportProfiles.name); // Order alphabetically

        return NextResponse.json({ profiles: profiles as CsvImportProfile[] }); // Cast for type safety
    } catch (error: any) {
        console.error('[API /import-profiles GET] Error fetching profiles:', error);
        return NextResponse.json({ error: 'Failed to fetch import profiles' }, { status: 500 });
    }
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await request.json();
        const parsedData = createProfileSchema.safeParse(body);

        if (!parsedData.success) {
            console.error('[API /import-profiles POST] Validation Error:', parsedData.error.errors);
            return NextResponse.json({ error: 'Invalid profile data', details: parsedData.error.errors }, { status: 400 });
        }

        const { name, config } = parsedData.data;

        // Check if a profile with the same name already exists for this user
        const existingProfile = await db.select({ id: csvImportProfiles.id })
            .from(csvImportProfiles)
            .where(eq(csvImportProfiles.userId, userId) && eq(csvImportProfiles.name, name))
            .limit(1);

        if (existingProfile.length > 0) {
            return NextResponse.json({ error: `Profile with name "${name}" already exists.` }, { status: 409 }); // Conflict
        }

        // Create the new profile
        const [newProfile] = await db.insert(csvImportProfiles)
            .values({
                userId: userId,
                name: name,
                config: config, // Drizzle handles JSON serialization
            })
            .returning({
                id: csvImportProfiles.id,
                name: csvImportProfiles.name,
                config: csvImportProfiles.config,
            });

        console.log(`[API /import-profiles POST] Created profile: ${newProfile.id} for user: ${userId}`);
        return NextResponse.json({ profile: newProfile as CsvImportProfile }, { status: 201 }); // Return the created profile

    } catch (error: any) {
        console.error('[API /import-profiles POST] Error creating profile:', error);
        // Handle potential unique constraint violation on name if race condition occurs
        if (error.code === '23505') { // PostgreSQL unique violation code
            return NextResponse.json({ error: `Profile name conflict.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create import profile' }, { status: 500 });
    }
} 