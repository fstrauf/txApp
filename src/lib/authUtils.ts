import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Define our JWT payload structure (ensure this matches the one used during signing)
// Export the interface so it can be imported by other modules
export interface JwtPayload extends jose.JWTPayload {
  id: string; // Assuming 'id' is the user identifier in the payload
  email: string;
  // Add other claims if they exist
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

/**
 * Verifies the JWT token from the Authorization header.
 * @param request - The NextRequest object.
 * @returns The verified JWT payload if valid, otherwise null.
 */
export async function verifyAuth(request: NextRequest): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Auth header missing or invalid');
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const { payload } = await jose.jwtVerify<JwtPayload>(token, secret);
    // console.log('JWT Verified Payload:', payload); // Optional: log payload for debugging
    return payload;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown JWT verification error');
    // Log specific JWT errors for server-side debugging
    if (error.name === 'JWTExpired') {
        console.error('Auth Error: JWT Expired');
    } else if (error.name === 'JWTClaimValidationFailed') {
        console.error('Auth Error: JWT Claim Validation Failed', error.message);
    } else if (error.name === 'JWSInvalid' || error.name === 'JWSVerificationFailed') {
        console.error('Auth Error: JWT Invalid/Verification Failed');
    } else {
        console.error('Auth Error: JWT Verification Failed:', error.message);
    }    
    return null;
  }
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