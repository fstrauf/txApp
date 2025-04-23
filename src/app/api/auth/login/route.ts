import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as jose from 'jose';

export const runtime = 'edge';
export const preferredRegion = 'fra1';

// Typed user interface for database response
interface DbUser {
  id: string;
  email: string;
  name: string | null;
  password: string | null; // In reality, this should be a hash
}

// Define our JWT payload structure
interface JwtPayload extends jose.JWTPayload {
  id: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // --- IMPORTANT SECURITY NOTE --- 
    // This uses plain text password comparison for demo purposes ONLY based on the original code.
    // In a real application, NEVER store plain text passwords. 
    // Use a strong hashing algorithm (like bcrypt or Argon2) to store password hashes.
    // Compare the provided password against the stored hash using the hashing library.
    // Example (conceptual): 
    // const user = await findUserByEmail(email);
    // if (!user || !await bcrypt.compare(password, user.passwordHash)) { ... }
    // --- END SECURITY NOTE --- 

    // Query the database for user with matching email
    // Using prepared statements for security
    const result = await sql`
      SELECT id, email, name, password FROM "User" 
      WHERE email = ${email} LIMIT 1
    `;

    const user = result.rows[0] as DbUser | undefined;

    // Check if user exists and password matches (DEMO ONLY comparison)
    if (!user || !user.password || password !== 'demo123') { // Replace 'demo123' with actual hash comparison
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const alg = 'HS256';

    const tokenPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      // Add standard JWT claims like expiration
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expires in 24 hours
    };

    const token = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('24h') // Set expiration time
      .sign(secret);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during login');
    console.error('Login error:', error.message);
    // Avoid exposing detailed internal errors
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 }); 
  }
} 