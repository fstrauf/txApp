import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/db";
import { bankAccounts } from "@/db/schema";
import { findUserByEmail } from "@/db/utils";
import { asc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user ID
    const user = await findUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Cast user.id to string to satisfy TypeScript
    const userId = user.id as string;

    // Fetch all bank accounts for this user
    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(asc(bankAccounts.name));

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[ACCOUNTS_GET]", error);
    return NextResponse.json(
      { message: "Error fetching accounts", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 