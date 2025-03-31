import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'
import { sql } from '@vercel/postgres'
import { sign } from 'hono/jwt'
import type { Context } from 'hono'

export const runtime = 'edge'
export const preferredRegion = 'fra1' // Choose your preferred region

const app = new Hono().basePath('/api')

// Add logging middleware
app.use('*', logger())

// Add CORS middleware to allow mobile app access
app.use('*', cors({
  origin: [
    'http://localhost:3000',           // Local web development
    'exp://localhost:8081',            // Local Expo development
    'https://tx-app.vercel.app',       // Production web app
    '*'                                // Allow mobile app in production
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}))

// Health check endpoint
app.get('/health', (c: Context) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Typed user interface for database response
interface DbUser {
  id: string
  email: string
  name: string | null
  password: string | null
}

// Define our JWT payload structure
interface JwtPayload {
  id: string
  email: string
  [key: string]: unknown
}

// Auth login endpoint
app.post('/auth/login', async (c: Context) => {
  try {
    const body = await c.req.json()
    const { email, password } = body as { email?: string; password?: string }
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Query the database for user with matching email
    const result = await sql`
      SELECT id, email, name, password FROM "User" 
      WHERE email = ${email} LIMIT 1
    `
    
    const user = result.rows[0] as DbUser | undefined
    
    if (!user || !user.password) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // For demonstration purposes only - in production, use proper password comparison
    // TODO: Implement proper password verification with bcrypt
    const isPasswordValid = password === 'demo123'
    
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Create JWT token for authentication
    const tokenPayload: JwtPayload = {
      id: user.id,
      email: user.email
    }
    
    const token = await sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback-secret-key'
    )
    
    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error')
    console.error('Login error:', error.message)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

// Protected routes middleware
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'fallback-secret-key'
})

// Protected route example
app.get('/user/profile', authMiddleware, async (c: Context) => {
  try {
    const payload = c.get('jwtPayload') as JwtPayload
    const userId = payload.id as string
    
    // Query the database for user profile data
    const result = await sql`
      SELECT id, email, name FROM "User" 
      WHERE id = ${userId} LIMIT 1
    `
    
    const user = result.rows[0] as DbUser | undefined
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error')
    console.error('Profile fetch error:', error.message)
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Export Vercel Edge Functions handlers
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app) 