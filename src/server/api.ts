const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { jwt: honoJwt } = require('hono/jwt');
const { logger } = require('hono/logger');
const { eq } = require('drizzle-orm');
const { db } = require('../db/index');
const { users, transactions } = require('../db/schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth').default;

// Initialize Hono app
const app = new Hono();

// Types for JWT payload
interface JwtPayload {
  id: string;
  email: string;
  [key: string]: unknown;
}

// Import Context type from Hono
import type { Context } from 'hono';

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'exp://localhost:8081'],
    credentials: true,
  })
);

// Public routes
const publicRoutes = new Hono();

publicRoutes.get('/', (c: Context) => {
  return c.json({ message: 'API is running' });
});

// Register the password reset routes
publicRoutes.route('/auth', authRoutes);

// Legacy login route (can be removed once clients are updated to use the new route)
publicRoutes.post('/auth/login', async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    
    // Find user by email with specific columns
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
      process.env.JWT_SECRET || 'your-secret-key',
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
    return c.json({ error: 'Authentication failed' }, 401);
  }
});

// Protected routes
const protectedRoutes = new Hono();

// JWT authentication middleware
protectedRoutes.use(
  '*',
  honoJwt({
    secret: process.env.JWT_SECRET || 'your-secret-key',
  })
);

protectedRoutes.get('/user/profile', async (c: Context) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    
    // Fetch user profile data
    const userResults = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    }).from(users).where(eq(users.id, userId)).limit(1);
    
    const user = userResults[0];
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

protectedRoutes.get('/transactions', async (c: Context) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    
    // Fetch user transactions
    const userTransactions = await db.select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
    }).from(transactions).where(eq(transactions.userId, userId)).limit(50);
    
    return c.json({ transactions: userTransactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Mount routes
app.route('', publicRoutes);
app.route('/api', protectedRoutes);

module.exports = app; 