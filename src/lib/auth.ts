import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/db";
import * as schema from "@/db/schema"; // Import all schemas
import { sql } from "drizzle-orm";
import * as bcrypt from 'bcryptjs';
import { DrizzleAdapter } from "@auth/drizzle-adapter";

// No longer need custom AuthorizeUser with accessToken

// Simplified auth configuration with direct SQL queries
export const authConfig: NextAuthOptions = {
  // Pass the imported schema to the adapter
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Simplify authorize: Only verify DB password
      async authorize(credentials): Promise<NextAuthUser | null> { 
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log(`[Authorize] Authenticating user: ${credentials.email}`);
          
          const usersResult = await db.execute(
            sql`SELECT * FROM users WHERE email = ${credentials.email} LIMIT 1`
          );
          
          if (usersResult.rows.length === 0) {
             console.log(`[Authorize] User not found: ${credentials.email}`);
             return null;
          }

          const user = usersResult.rows[0];
            
          if (typeof user.password !== 'string' || !user.password) {
            console.log(`[Authorize] Invalid password format for user: ${credentials.email}`);
            return null;
          }
            
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log(`[Authorize] Password verification result: ${isPasswordValid}`);
            
          if (!isPasswordValid) {
            console.log(`[Authorize] Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`[Authorize] User authenticated successfully (DB only): ${credentials.email}`);
          
          // Return standard user object (no accessToken)
          return {
            id: String(user.id),
            email: typeof user.email === 'string' ? user.email : null,
            name: typeof user.name === 'string' ? user.name : null
          };

        } catch (error) {
          console.error("[Authorize] Error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // Simplify session callback: Just add user ID
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      // Removed accessToken logic
      console.log("[Session Callback] Returning session:", session);
      return session;
    },
    // Simplify jwt callback: No need to handle accessToken
    async jwt({ token, user }) {
      // Basic JWT logic (sub is added automatically)
      console.log("[JWT Callback] Returning token:", token);
      return token;
    },
  },
  debug: process.env.NODE_ENV !== "production",
};

/**
 * Hashes a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a password against a hash
 * @param password Plain text password to verify
 * @param hashedPassword Hashed password to compare against
 * @returns Boolean indicating if the password matches the hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
} 