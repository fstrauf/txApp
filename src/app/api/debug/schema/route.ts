import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { accounts } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Get the database schema for the Account table (note the capital "A")
    const accountSchema = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'Account'
      ORDER BY 
        ordinal_position
    `);

    // Get account table constraints - note the capital "A" in Account
    const accountConstraints = await db.execute(sql`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM 
        pg_constraint
      WHERE 
        conrelid = 'public."Account"'::regclass
      ORDER BY 
        conname
    `);

    // Get the first few accounts from the database
    // This uses the accounts schema object from drizzle, which should map to the correct table
    const accountRecords = await db.select().from(accounts).limit(5);

    // Check if we can insert a test account
    let insertResult: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      // Use the most basic data required by the schema
      const result = await db.insert(accounts).values({
        id: 'debug-test-account',
        userId: 'debug-test-user',
        type: 'debug',
        provider: 'debug',
        providerAccountId: 'debug-test',
      }).returning({ id: accounts.id });
      
      insertResult.success = true;
      
      // Clean up the test data
      await db.delete(accounts).where(sql`id = 'debug-test-account'`);
    } catch (error) {
      insertResult.error = error instanceof Error ? error.message : String(error);
    }

    // Extract only the column definitions from the accounts object
    // This avoids the circular reference error when stringifying
    const accountColumns: Record<string, { name: string, dataType: string }> = {};
    
    for (const [key, value] of Object.entries(accounts)) {
      if (key !== '_' && !key.startsWith('_') && typeof value === 'object' && value !== null) {
        accountColumns[key] = {
          name: value.name || key,
          dataType: value.dataType?.toString() || 'unknown'
        };
      }
    }

    return NextResponse.json({
      schema: {
        columns: accountSchema,
        constraints: accountConstraints,
      },
      records: accountRecords,
      testInsert: insertResult,
      schemaDefinition: {
        accountsColumns: accountColumns,
        tableName: 'Account'
      }
    });
  } catch (error) {
    console.error('Error debugging schema:', error);
    return NextResponse.json({
      error: 'Failed to get schema information',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 