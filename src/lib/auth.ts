import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/db";
import * as schema from "@/db/schema"; // Import all schemas
import { sql, eq } from "drizzle-orm";
import * as bcrypt from 'bcryptjs';
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Account } from "next-auth"; // Import Account type for JWT context

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
    // Modify session callback to include apiKey
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      // Add apiKey from token to session
      if (token.apiKey) {
         // Define a type for the session object or use type assertion
         (session as any).apiKey = token.apiKey as string;
      }
      // Note: We don't need trialStarted flag in the session, it's handled during redirect
      return session;
    },
    // Modify jwt callback - REMOVE trial start logic
    async jwt({ token, user, account, trigger, session }) {
      // Only handle API key fetching on initial sign-in
      if (user?.id) { 
        console.log(`[JWT Callback] Initial sign-in for user ID: ${user.id}. Fetching API key.`);
        try {
          const userResult = await db
            .select({ apiKey: schema.users.api_key })
            .from(schema.users)
            .where(eq(schema.users.id, user.id))
            .limit(1);

          const userApiKey = userResult[0]?.apiKey;
          if (userApiKey) {
            token.apiKey = userApiKey;
            console.log(`[JWT Callback] Added API key to token for user ${user.id}`);
          } else {
            console.warn(`[JWT Callback] No API key found for user ${user.id}`);
          }
        } catch (error) {
          console.error(`[JWT Callback] Error fetching API key for user ${user.id}:`, error);
        }
      }
      return token;
    },
    // Restore smarter redirect logic prioritizing callbackUrl query param
    async redirect({ url, baseUrl }) { 
        console.log(`[Redirect Callback] Incoming Url: ${url}`);
        console.log(`[Redirect Callback] BaseUrl: ${baseUrl}`);
        
        const incomingUrlObject = new URL(url, baseUrl);
        const callbackUrlParam = incomingUrlObject.searchParams.get('callbackUrl');
        console.log(`[Redirect Callback] Detected callbackUrlParam: ${callbackUrlParam}`);

        // 1. Prioritize callbackUrl query parameter if present and valid
        if (callbackUrlParam) {
            let redirectTarget = callbackUrlParam;
            // Ensure it's treated as a relative path if it starts with /
            if (redirectTarget.startsWith('/')) {
                const finalRedirect = `${baseUrl}${redirectTarget}`;
                console.log(`[Redirect Callback] Using callbackUrlParam (relative): ${finalRedirect}`);
                return finalRedirect;
            }
            // Check if it's a valid absolute URL on the same origin
            try {
                const callbackUrlObject = new URL(redirectTarget);
                if (callbackUrlObject.origin === baseUrl) {
                    console.log(`[Redirect Callback] Using callbackUrlParam (absolute same origin): ${redirectTarget}`);
                    return redirectTarget;
                }
            } catch (e) {
                console.warn('[Redirect Callback] Invalid callbackUrlParam, falling back.', e);
            }
        }

        // 2. Fallback: Check the base 'url' parameter itself (less likely to be correct in this flow)
        // Allows relative URLs passed directly in 'url' 
        if (url.startsWith("/")) { 
            const finalRedirect = `${baseUrl}${url}`;
            console.log(`[Redirect Callback] Using relative url: ${finalRedirect}`);
            return finalRedirect;
        }
        // Allows absolute URLs on the same origin passed directly in 'url'
        try {
            const urlObject = new URL(url);
            if (urlObject.origin === baseUrl) {
                 console.log(`[Redirect Callback] Using absolute url on same origin: ${url}`);
                 return url;
            }
        } catch(e) { 
            // Invalid URL, fall through 
        }

        // 3. Final Fallback: Redirect to baseUrl
        console.log(`[Redirect Callback] Defaulting to baseUrl: ${baseUrl}`);
        return baseUrl
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