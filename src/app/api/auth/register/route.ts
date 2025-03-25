import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail, createId } from "@/db/utils";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Attempting to register user with email: ${email}`);

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      console.log(`User with email ${email} already exists`);
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);
    const userId = createId();

    console.log(`Creating new user with id: ${userId}, email: ${email}`);

    try {
      // First try with Drizzle ORM
      await db.insert(users).values({
        id: userId,
        name,
        email,
        password: hashedPassword,
      });
      
      console.log(`User created successfully using Drizzle ORM, id: ${userId}`);
    } catch (ormError) {
      console.error("Error using Drizzle ORM for insert:", ormError);
      
      // Fallback to direct SQL
      try {
        console.log("Trying direct SQL insert instead");
        await db.execute(sql`
          INSERT INTO "User" ("id", "name", "email", "password") 
          VALUES (${userId}, ${name}, ${email}, ${hashedPassword})
        `);
        console.log(`User created successfully using direct SQL, id: ${userId}`);
      } catch (sqlError) {
        console.error("Error using direct SQL for insert:", sqlError);
        throw sqlError;
      }
    }

    return NextResponse.json(
      { message: "User created successfully", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: String(error) },
      { status: 500 }
    );
  }
} 