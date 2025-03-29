import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { users } from '../../../db/schema'
import { db } from '../../../db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'

export const runtime = 'edge'
export const preferredRegion = 'fra1' // Choose your preferred region

const app = new Hono().basePath('/api')

// Error handling middleware
app.onError((err, c) => {
  console.error(`[API Error] ${err.message}`, err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

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
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Find user by email with specific columns
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password
    }).from(users).where(eq(users.email, email)).limit(1)
    const user = userResults[0]
    
    if (!user || !user.password) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set')
      return c.json({ error: 'Server configuration error' }, 500)
    }

    // Generate JWT token
    const token = jsonwebtoken.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    return c.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
})

// Protected routes middleware
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key'
}))

// Protected routes
app.get('/api/user/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.id
    
    const userResults = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    }).from(users).where(eq(users.id, userId)).limit(1)
    
    const user = userResults[0]
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app) 