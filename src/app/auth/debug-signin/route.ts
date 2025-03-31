import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { sign } from "jsonwebtoken";

// A simplified debug sign-in endpoint that doesn't attempt to set cookies
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing email or password" },
        { status: 400 }
      );
    }

    console.log(`[DEBUG-SIGNIN] Attempting sign-in for email: ${email}`);

    // Try to find the user with direct SQL
    try {
      console.log("[DEBUG-SIGNIN] Executing SQL query to find user");
      const result = await db.execute(sql`SELECT * FROM "User" WHERE "email" = ${email} LIMIT 1`);
      
      console.log(`[DEBUG-SIGNIN] Query result rows: ${result.rows.length}`);
      
      if (result.rows.length === 0) {
        console.log(`[DEBUG-SIGNIN] No user found with email: ${email}`);
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }
      
      const user = result.rows[0];
      console.log(`[DEBUG-SIGNIN] User found: ${user.id}`);
      
      // Check if password exists and is a string
      if (typeof user.password !== 'string' || !user.password) {
        console.log(`[DEBUG-SIGNIN] User ${email} has invalid password format`);
        return NextResponse.json(
          { success: false, message: "Account configuration issue" },
          { status: 500 }
        );
      }
      
      // Verify password
      const isValidPassword = await compare(password, user.password);
      
      if (!isValidPassword) {
        console.log(`[DEBUG-SIGNIN] Invalid password for user: ${email}`);
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }
      
      // Create a token
      const token = sign(
        { 
          id: user.id,
          email: user.email,
          name: user.name
        },
        process.env.NEXTAUTH_SECRET || "fallback-secret",
        { expiresIn: "7d" }
      );
      
      console.log(`[DEBUG-SIGNIN] User ${email} authenticated successfully`);
      
      // Return the token in the response rather than setting a cookie
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      });
      
    } catch (sqlError) {
      console.error("[DEBUG-SIGNIN] Database error:", sqlError);
      return NextResponse.json(
        { success: false, message: "Database error", details: String(sqlError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[DEBUG-SIGNIN] General error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication error", details: String(error) },
      { status: 500 }
    );
  }
} 