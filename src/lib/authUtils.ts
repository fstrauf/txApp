import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getToken } from 'next-auth/jwt'; // Import getToken
import { users, subscriptionStatusEnum } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

// Define our JWT payload structure 
// Allow email and name to be potentially null, like NextAuth's token
export interface JwtPayload extends jose.JWTPayload {
  id: string;      // User ID 
  sub?: string;     // Standard JWT subject (often user ID in NextAuth)
  email?: string | null; // Allow null
  name?: string | null;  // Allow null
  // Add other claims if they exist in either token type
}

const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || // Use NEXTAUTH_SECRET as the primary source
    process.env.JWT_SECRET || 
    'fallback-secret-key'
);

/**
 * Verifies authentication based on either Authorization header or NextAuth session cookie.
 * @param request - The NextRequest object.
 * @returns The verified JWT payload if valid, otherwise null.
 */
export async function verifyAuth(request: NextRequest): Promise<JwtPayload | null> {
  // 1. Try verifying Authorization Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer '
    try {
      // Ensure the verified payload conforms to JwtPayload
      const { payload } = await jose.jwtVerify<JwtPayload>(token, secret);
      console.log('Authenticated via Bearer Token');
      // Ensure payload has the id field we need
      const userId = payload.id || payload.sub;
      if (!userId) throw new Error('User ID (id or sub) missing in Bearer token payload');
      // Return a consistent structure, ensuring id is set
      return { ...payload, id: userId };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown JWT verification error');
       if (error.name === 'JWTExpired') {
            console.error('Auth Error (Bearer): JWT Expired');
       } else {
            console.error('Auth Error (Bearer): JWT Verification Failed:', error.message);
       }
      return null; 
    }
  }

  // 2. If no valid Bearer token, try verifying NextAuth session cookie
  try {
    const nextAuthToken = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET, 
    });

    if (nextAuthToken) {
        console.log('Authenticated via NextAuth Session Cookie');
        // Adapt NextAuth token structure to our expected JwtPayload
        const userId = nextAuthToken.sub || nextAuthToken.id as string | undefined;
        if (!userId) throw new Error('User ID (sub or id) missing in NextAuth token payload');
        
        // Create the payload, explicitly handling potential nulls from NextAuth
        const payload: JwtPayload = {
            ...nextAuthToken, 
            id: userId,
            email: nextAuthToken.email === null ? undefined : nextAuthToken.email, // Map null to undefined
            name: nextAuthToken.name === null ? undefined : nextAuthToken.name,   // Map null to undefined
        };
        
        return payload;
    }
  } catch (err) {
      console.error('Auth Error (NextAuth): Failed to process session token:', err);
      return null;
  }
  
  // 3. If neither method works, authentication fails
  console.error('Auth Error: No valid Bearer token or NextAuth session found');
  return null;
}

/**
 * Middleware-like function to handle authentication for API routes.
 * If authentication fails, it returns an appropriate NextResponse.
 * If authentication succeeds, it calls the provided handler with the request and payload.
 * 
 * @param handler - The actual API route handler function.
 * @returns A new function that wraps the handler with authentication checks.
 */
export function withAuth<T extends (request: NextRequest, payload: JwtPayload) => Promise<NextResponse> | NextResponse>(
  handler: T
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the original handler with the request and the verified payload
    return handler(request, payload);
  };
}

// Define the input type manually, explicitly handling nulls
export type UserSubscriptionData = {
  subscriptionStatus: typeof subscriptionStatusEnum.enumValues[number] | null;
  currentPeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
};

/**
 * Checks if a user has an active subscription (paid or trial) using simplified logic.
 * @param userData Object containing user's subscription status, current period end, and trial end.
 * @returns True if the user has an active subscription or trial, false otherwise.
 */
export function hasActiveSubscriptionOrTrial(userData: UserSubscriptionData | null | undefined): boolean {
  if (!userData) {
    return false;
  }

  // Check 1: Active Stripe Subscription ('ACTIVE' or 'TRIALING' status + valid date)
  const isStripeStatusActive =
    userData.subscriptionStatus === 'ACTIVE' ||
    userData.subscriptionStatus === 'TRIALING';

  const isStripeDateValid =
    !!userData.currentPeriodEndsAt && // Check if date exists
    userData.currentPeriodEndsAt.getTime() > Date.now(); // Check if it's in the future

  if (isStripeStatusActive && isStripeDateValid) {
    return true; // Has active Stripe sub (paid or trial)
  }

  // Check 2: Active App-Managed Trial (non-Stripe trial)
  const isAppTrialDateValid =
    !!userData.trialEndsAt && // Check if date exists
    userData.trialEndsAt.getTime() > Date.now(); // Check if it's in the future

  // Return true if the app trial is valid (covers cases where Stripe sub wasn't active)
  return isAppTrialDateValid;
} 