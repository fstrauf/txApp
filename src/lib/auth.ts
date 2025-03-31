import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/db";
import * as schema from "@/db/schema"; // Import all schemas
import { sql } from "drizzle-orm";
import { JWT } from "next-auth/jwt";
import * as bcrypt from 'bcryptjs';
import { DrizzleAdapter } from "@auth/drizzle-adapter";

// Define a type for our User
interface User {
  id: string;
  email: string | null;
  name: string | null;
}

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log(`Authenticating: ${credentials.email}`);
          
          // First try the users table (new schema)
          const usersResult = await db.execute(
            sql`SELECT * FROM users WHERE email = ${credentials.email} LIMIT 1`
          );
          
          if (usersResult.rows.length > 0) {
            const user = usersResult.rows[0];
            
            // Ensure password is a string
            if (typeof user.password !== 'string' || !user.password) {
              console.log(`[Authorize] Invalid password format for user in users table: ${credentials.email}`);
              return null;
            }
            
            console.log(`[Authorize] Attempting to verify password for: ${credentials.email}`);
            console.log(`[Authorize] Provided password length: ${credentials.password.length}`);
            console.log(`[Authorize] Stored hash length: ${user.password.length}`);
            console.log(`[Authorize] Stored hash (first 5): ${user.password.substring(0, 5)}`);

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            console.log(`[Authorize] Password verification result (direct compare): ${isPasswordValid}`);
            
            if (!isPasswordValid) {
              console.log(`[Authorize] Invalid password for user in users table (direct compare): ${credentials.email}`);
              return null;
            }

            console.log(`User authenticated successfully from users table: ${credentials.email}`);
            
            // Return a properly typed user object
            return {
              id: String(user.id),
              email: typeof user.email === 'string' ? user.email : null,
              name: typeof user.name === 'string' ? user.name : null
            };
          }
          
          // If not found in users table, try the User table (legacy schema)
          const userResult = await db.execute(
            sql`SELECT * FROM "User" WHERE email = ${credentials.email} LIMIT 1`
          ).catch(() => ({ rows: [] })); // Handle table not existing
          
          if (userResult.rows.length === 0) {
            console.log(`User not found in any table: ${credentials.email}`);
            return null;
          }
          
          const rawUser = userResult.rows[0];
          
          // Ensure password is a string
          if (typeof rawUser.password !== 'string' || !rawUser.password) {
            console.log(`Invalid password format for user in User table: ${credentials.email}`);
            return null;
          }
          
          const isPasswordValid = await compare(credentials.password, rawUser.password);
          
          if (!isPasswordValid) {
            console.log(`Invalid password for user in User table: ${credentials.email}`);
            return null;
          }

          console.log(`User authenticated successfully from User table: ${credentials.email}`);
          
          // Return a properly typed user object
          return {
            id: String(rawUser.id),
            email: typeof rawUser.email === 'string' ? rawUser.email : null,
            name: typeof rawUser.name === 'string' ? rawUser.name : null
          };
        } catch (error) {
          console.error("Auth error:", error);
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
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
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