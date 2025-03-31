import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { randomUUID } from "crypto";
import { getResendClient } from "@/lib/resend";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in .env
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@expensesorted.com';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Generate a reset token and expiry time (1 hour from now)
    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token and expiry
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry: resetTokenExpiry,
      })
      .where(eq(users.id, user.id));

    // Send email with reset link
    const resend = getResendClient();
    if (!resend) {
      console.warn("Resend client is not available. Email not sent. Check your RESEND_API_KEY environment variable.");
      return NextResponse.json(
        { success: true, debug: { emailSent: false, reason: "Missing Resend API key" } },
        { status: 200 }
      );
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    console.log(`Attempting to send reset email to: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    
    try {
      const emailResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Reset your password",
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested a password reset for your ExpenseSorted account.</p>
          <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
      
      console.log("Resend email response:", emailResult);
      
      return NextResponse.json(
        { 
          success: true, 
          debug: { 
            emailSent: true, 
            resetToken, 
            resetUrl,
            resendResponse: emailResult 
          } 
        },
        { status: 200 }
      );
    } catch (resendError) {
      console.error("Resend email error:", resendError);
      
      return NextResponse.json(
        { 
          success: true, 
          debug: { 
            emailSent: false, 
            reason: "Resend API error", 
            error: resendError instanceof Error ? resendError.message : "Unknown error" 
          } 
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in forgot password route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 