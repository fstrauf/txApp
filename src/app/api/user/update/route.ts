import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByEmail } from "@/db/utils";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return new NextResponse("Invalid input", { status: 400 });
    }

    const existingUser = await findUserByEmail(session.user.email);
    
    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const [user] = await db
      .update(users)
      .set({ name })
      .where(eq(users.email, session.user.email))
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[USER_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 