import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createId, findUserByEmail } from "@/db/utils";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[Register API] Attempting to register user with email: ${email}`);

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      console.log(`[Register API] User with email ${email} already exists`);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 } // Conflict
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const userId = createId();

    console.log(`[Register API] Creating new user with id: ${userId}, email: ${email}`);

    // Insert new user into the database
    await db.insert(users).values({
      id: userId,
      name,
      email,
      password: hashedPassword,
      emailVerified: null, // Explicitly set emailVerified to null for credentials signup
      updatedAt: new Date(),
    });

    console.log(`[Register API] User created successfully using Drizzle ORM, id: ${userId}`);

    // Exclude password from response
    const newUser = {
      id: userId,
      name,
      email,
    };

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error("[Register API] Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong during registration", error: String(error) },
      { status: 500 }
    );
  }
} 