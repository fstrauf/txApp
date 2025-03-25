import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Define a type for our User
interface User {
  id: string;
  email: string | null;
  name: string | null;
}

// Simplified auth configuration with direct SQL queries
export const authConfig: NextAuthOptions = {
  providers: [
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
          
          // Use direct SQL query to find the user
          const userResult = await db.execute(
            sql`SELECT * FROM "User" WHERE email = ${credentials.email} LIMIT 1`
          );
          
          if (userResult.rows.length === 0) {
            console.log(`User not found: ${credentials.email}`);
            return null;
          }
          
          const rawUser = userResult.rows[0];
          
          // Ensure password is a string
          if (typeof rawUser.password !== 'string' || !rawUser.password) {
            console.log(`Invalid password format for user: ${credentials.email}`);
            return null;
          }
          
          const isPasswordValid = await compare(credentials.password, rawUser.password);
          
          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`User authenticated successfully: ${credentials.email}`);
          
          // Return a properly typed user object
          const user: User = {
            id: String(rawUser.id),
            email: typeof rawUser.email === 'string' ? rawUser.email : null,
            name: typeof rawUser.name === 'string' ? rawUser.name : null
          };
          
          return user;
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
        // @ts-expect-error - Adding id to session user
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