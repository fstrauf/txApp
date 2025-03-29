import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in .env
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Initialize Resend with API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@expensesorted.com';
const resend = new Resend(RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json({ success: true });
    }

    // Generate a reset token
    const token = jwt.sign(
      {
        email: user.email,
        id: user.id,
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Build the reset URL
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

    // Send email using Resend
    if (RESEND_API_KEY) {
      // Ensure email is a string 
      const userEmail = user.email || email;
      
      await resend.emails.send({
        from: EMAIL_FROM,
        to: userEmail,
        subject: 'Reset Your Password - ExpenseSorted',
        text: `Hello ${user.name || 'there'},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThe link is valid for 1 hour. If you didn't request this, please ignore this email.\n\nThanks,\nExpenseSorted Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Reset Your Password</h2>
            <p>Hello ${user.name || 'there'},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>The link is valid for 1 hour. If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br>ExpenseSorted Team</p>
          </div>
        `,
      });
      console.log(`Password reset email sent to ${email}`);
    } else {
      console.log('Resend API key missing. Not sending actual email.');
      console.log(`Reset URL for ${email}: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 