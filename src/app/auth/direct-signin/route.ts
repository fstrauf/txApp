import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/db/utils";
import { sign } from "jsonwebtoken";

// A simple JWT-based authentication alternative to NextAuth
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing email or password" },
        { status: 400 }
      );
    }

    console.log(`Attempting direct sign-in for email: ${email}`);

    // Try to find the user
    let user: any = null;
    
    try {
      // First try using our utility function
      user = await findUserByEmail(email);
    } catch (error) {
      console.error("Error using findUserByEmail:", error);
      
      // Try direct SQL query as fallback
      try {
        console.log("Trying direct SQL query to find user");
        const result = await db.execute(sql`SELECT * FROM "User" WHERE "email" = ${email} LIMIT 1`);
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          console.log("User found using direct SQL");
        }
      } catch (sqlError) {
        console.error("Error with direct SQL query:", sqlError);
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password with proper type checking
    if (typeof user.password !== 'string') {
      console.log(`User ${email} has invalid password format`);
      return NextResponse.json(
        { success: false, message: "Invalid account configuration" },
        { status: 500 }
      );
    }
    
    const isValidPassword = await compare(password, user.password);
    
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${email}`);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create a simple JWT
    const token = sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    );

    // Set cookie with Response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    // Set the cookie on the response object
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`User ${email} authenticated successfully`);

    return response;
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication error", error: String(error) },
      { status: 500 }
    );
  }
} 