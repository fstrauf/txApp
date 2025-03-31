import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Resend } from 'resend';

// Get environment variables
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@expensesorted.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize Resend only when needed
function getResendClient() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("Warning: RESEND_API_KEY is not defined - Email functionality will not work properly");
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

const auth = new Hono();

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Find user by email
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password
    }).from(users).where(eq(users.email, email)).limit(1);
    
    const user = userResults[0];
    
    if (!user || !user.password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return c.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Forgot password endpoint
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Find the user by email
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    }).from(users).where(eq(users.email, email)).limit(1);
    
    const user = userResults[0];

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return c.json({ success: true });
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

    // Get Resend client
    const resend = getResendClient();
    
    // Send email using Resend if available
    if (resend) {
      // Ensure we have a valid email address
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

    return c.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

// Reset password endpoint
auth.post('/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password) {
      return c.json({ error: 'Token and password are required' }, 400);
    }

    // Verify the token
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }

    const { email } = payload;

    // Find the user
    const userResults = await db.select({
      id: users.id
    }).from(users).where(eq(users.email, email)).limit(1);
    
    const user = userResults[0];

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

export default auth; 