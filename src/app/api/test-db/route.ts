import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Test direct database query to check the User table
    const result = await db.execute(sql`SELECT * FROM "User" LIMIT 1`);
    
    if (result.rows.length > 0) {
      // Return table info with the user data (redact sensitive fields)
      const userData = { ...result.rows[0] };
      if (userData.password) {
        userData.password = "[REDACTED]";
      }
      
      return NextResponse.json({
        message: "Database connection successful",
        tableExists: true,
        firstUser: userData,
      });
    }
    
    return NextResponse.json({
      message: "Database connection successful, but no users found",
      tableExists: true,
      firstUser: null
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    
    return NextResponse.json({
      message: "Database connection error",
      error: error.message,
    }, { status: 500 });
  }
} 