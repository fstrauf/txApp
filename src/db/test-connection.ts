require('dotenv/config');
const { db } = require('./index');
const { sql } = require('drizzle-orm');

async function testConnection() {
  try {
    // Try a simple query to test the connection
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('Database connection successful!');
    console.log('Current timestamp:', result.rows[0]?.now || result.rows[0]?.NOW);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection(); 