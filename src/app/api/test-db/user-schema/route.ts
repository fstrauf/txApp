import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get table schema for the User table
    const schemaQuery = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `);

    // Check if table exists
    const tableQuery = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'User'
      )
    `);

    const tableExists = tableQuery.rows[0]?.exists === true;
    
    // Count users
    let userCount = 0;
    if (tableExists) {
      const countQuery = await db.execute(sql`SELECT COUNT(*) as count FROM "User"`);
      userCount = parseInt(countQuery.rows[0]?.count || '0');
    }

    // Get all table names
    const tablesQuery = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    return NextResponse.json({
      tableExists,
      userCount,
      schema: schemaQuery.rows,
      allTables: tablesQuery.rows.map((row: any) => row.table_name)
    });
  } catch (error: any) {
    console.error("Error fetching user schema:", error);
    
    return NextResponse.json({
      message: "Error fetching user schema",
      error: error.message,
    }, { status: 500 });
  }
} 