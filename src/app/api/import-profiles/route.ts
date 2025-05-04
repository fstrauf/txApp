import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { csvImportProfiles } from '@/db/schema';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic' // Ensures the route is dynamic

// --- Zod Schema for Profile Creation/Config ---
const profileConfigSchema = z.object({
    // Ensure mappings allows description2
    mappings: z.record(z.enum(['date', 'amount', 'description', 'description2', 'currency', 'category', 'none'])),
    dateFormat: z.string().min(1, 'Date format is required'),
    amountFormat: z.enum(['standard', 'negate', 'sign_column']),
    signColumn: z.string().optional(),
    skipRows: z.number().int().min(0).default(0),
    delimiter: z.string().optional(),
    bankAccountId: z.string().uuid().optional(), // Add optional bankAccountId
}).refine(data => data.amountFormat !== 'sign_column' || (data.amountFormat === 'sign_column' && data.signColumn), {
  message: "Sign column mapping is required when amount format is 'sign_column'",
  path: ["signColumn"], 
});

const createProfileSchema = z.object({
    name: z.string().min(1, "Profile name cannot be empty."),
    config: profileConfigSchema, // Use the updated config schema
});

// Add schema for updating (requires ID)
const updateProfileSchema = createProfileSchema.extend({
    id: z.string().uuid("Invalid Profile ID for update.")
});

// Update exported type
export type CsvImportProfile = {
    id: string;
    name: string;
    config: z.infer<typeof profileConfigSchema>; // Use updated config schema type
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

// --- POST Handler (Update schema usage) ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await request.json();
        // Use createProfileSchema
        const parsedData = createProfileSchema.safeParse(body); 

        if (!parsedData.success) {
            console.error('[API /import-profiles POST] Validation Error:', parsedData.error.errors);
            return NextResponse.json({ error: 'Invalid profile data', details: parsedData.error.errors }, { status: 400 });
        }

        const { name, config } = parsedData.data;

        // Check for existing profile name
        const existingProfile = await db.select({ id: csvImportProfiles.id })
            .from(csvImportProfiles)
            .where(and(
                eq(csvImportProfiles.userId, userId),
                eq(csvImportProfiles.name, name)
            ))
            .limit(1);

        if (existingProfile.length > 0) {
            return NextResponse.json({ error: `Profile with name "${name}" already exists.` }, { status: 409 }); // Conflict
        }

        // Create the new profile
        const [newProfile] = await db.insert(csvImportProfiles)
            .values({
                userId: userId,
                name: name,
                config: config, 
            })
            .returning({
                id: csvImportProfiles.id,
                name: csvImportProfiles.name,
                config: csvImportProfiles.config,
            });

        console.log(`[API /import-profiles POST] Created profile: ${newProfile.id} for user: ${userId}`);
        return NextResponse.json({ profile: newProfile as CsvImportProfile }, { status: 201 }); 

    } catch (error: any) { 
        console.error('[API /import-profiles POST] Error creating profile:', error);
        if (error.code === '23505') { 
            return NextResponse.json({ error: `Profile name conflict.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create import profile' }, { status: 500 });
     }
}

// --- PUT Handler (Add this) ---
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await request.json();
        const parsedData = updateProfileSchema.safeParse(body);

        if (!parsedData.success) {
            console.error('[API /import-profiles PUT] Validation Error:', parsedData.error.errors);
            return NextResponse.json({ error: 'Invalid profile data for update', details: parsedData.error.errors }, { status: 400 });
        }

        const { id, name, config } = parsedData.data;

        // Update the profile where id and userId match
        const [updatedProfile] = await db.update(csvImportProfiles)
            .set({
                name: name,
                config: config, // Drizzle handles JSON serialization
                updatedAt: new Date(), // Explicitly set updatedAt
            })
            .where(and(
                eq(csvImportProfiles.id, id),
                eq(csvImportProfiles.userId, userId) // Ensure user owns profile
            ))
            .returning({
                id: csvImportProfiles.id,
                name: csvImportProfiles.name,
                config: csvImportProfiles.config,
            });

        if (!updatedProfile) {
             return NextResponse.json({ error: 'Profile not found or not authorized to update.' }, { status: 404 });
        }

        console.log(`[API /import-profiles PUT] Updated profile: ${updatedProfile.id} for user: ${userId}`);
        return NextResponse.json({ profile: updatedProfile as CsvImportProfile }); // Return updated profile

    } catch (error: any) {
        console.error('[API /import-profiles PUT] Error updating profile:', error);
         if (error.code === '23505') { // Handle potential unique name constraint violation on update
            return NextResponse.json({ error: `Profile name conflict.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update import profile' }, { status: 500 });
    }
} 