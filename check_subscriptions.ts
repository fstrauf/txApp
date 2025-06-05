import { db } from './src/db';

async function checkSubscriptions() {
  try {
    console.log('Checking current subscriptions table data...');
    
    // Check for any duplicate stripeSubscriptionId values
    const duplicates = await db.execute(`
      SELECT "stripeSubscriptionId", COUNT(*) as count 
      FROM subscriptions 
      WHERE "stripeSubscriptionId" IS NOT NULL 
      GROUP BY "stripeSubscriptionId" 
      HAVING COUNT(*) > 1
    `);
    
    console.log('Duplicate stripeSubscriptionId values:', duplicates.rows);
    
    // Check for NULL values
    const nullCount = await db.execute(`
      SELECT COUNT(*) as null_count 
      FROM subscriptions 
      WHERE "stripeSubscriptionId" IS NULL
    `);
    
    console.log('NULL stripeSubscriptionId count:', nullCount.rows[0]);
    
    // Show all current data
    const allSubs = await db.execute(`
      SELECT id, "userId", "stripeSubscriptionId", status, plan, "createdAt" 
      FROM subscriptions 
      ORDER BY "createdAt" DESC
    `);
    
    console.log('\nAll current subscriptions:');
    console.table(allSubs.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    process.exit(1);
  }
}

checkSubscriptions();
