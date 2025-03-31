const dbClient = require('../db/index').db;
const { users } = require('../db/schema');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create test user
    await dbClient.insert(users).values({
      id: uuidv4(),
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      emailVerified: new Date(),
      updatedAt: new Date(),
    });

    console.log('Test user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser(); 