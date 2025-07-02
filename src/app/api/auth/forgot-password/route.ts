import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from "crypto";
import { getResendClient } from "@/lib/resend";

const EMAIL_FROM = process.env.EMAIL_FROM || 'ExpenseSorted <hi@expensesorted.com>';

export async function POST(request: Request) {
  try {
    // Log environment variables to help debug
    console.log("DEBUG - EMAIL_FROM value:", EMAIL_FROM);
    console.log("DEBUG - Raw env value:", process.env.EMAIL_FROM);
    console.log("DEBUG - Type of EMAIL_FROM:", typeof EMAIL_FROM);
    
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
      // First try with the custom domain
      const formattedFrom = "ExpenseSorted <hi@expensesorted.com>";
      
      // Fallback to a resend.com address if needed
      const fallbackFrom = "ExpenseSorted <onboarding@resend.dev>";
      
      console.log("DEBUG - Trying to send email with from:", formattedFrom);
      
      try {
        const emailResult = await resend.emails.send({
          from: formattedFrom,
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
      } catch (primaryError) {
        console.error("Error with primary email sender:", primaryError);
        
        // If it's a validation error, try the fallback
        if (primaryError && 
            typeof primaryError === 'object' && 
            'name' in primaryError && 
            primaryError.name === 'validation_error') {
          console.log("Validation error - trying fallback sender:", fallbackFrom);
          
          try {
            const fallbackResult = await resend.emails.send({
              from: fallbackFrom,
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
            
            console.log("Fallback email response:", fallbackResult);
            
            return NextResponse.json(
              { 
                success: true, 
                debug: { 
                  emailSent: true, 
                  resetToken, 
                  resetUrl,
                  fallbackUsed: true,
                  resendResponse: fallbackResult 
                } 
              },
              { status: 200 }
            );
          } catch (fallbackError) {
            console.error("Error with fallback email sender:", fallbackError);
            throw fallbackError; // Re-throw to be caught by the outer catch
          }
        } else {
          throw primaryError; // Re-throw non-validation errors
        }
      }
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