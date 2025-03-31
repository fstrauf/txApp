import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const user = await db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "Invalid token" },
        { status: 200 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const tokenExpiry = user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null;

    if (!tokenExpiry || tokenExpiry < now) {
      return NextResponse.json(
        { valid: false, error: "Token has expired" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify token" },
      { status: 500 }
    );
  }
} 