import { and, eq } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  categories,
  bankAccounts,
  transactions,
  trainingJobs,
  classificationJobs,
  monthlyAggregates,
  categoryExpenses,
} from './schema';
import { sql } from 'drizzle-orm';

// User queries
export async function findUniqueUser(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function findUserByEmail(email: string) {
  try {
    console.log(`Looking up user with email: ${email}`);
    
    // Try using direct SQL query since we're having issues
    const result = await db.execute(sql`SELECT * FROM "User" WHERE "email" = ${email} LIMIT 1`);
    
    if (result.rows.length > 0) {
      console.log(`User found with email ${email}`);
      return result.rows[0];
    }
    
    console.log(`No user found with email ${email}`);
    return null;
  } catch (error) {
    console.error(`Error finding user by email ${email}:`, error);
    throw error;
  }
}

// Category queries
export async function findUniqueCategory(id: string) {
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function findCategoryByNameAndUserId(name: string, userId: string) {
  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.name, name), eq(categories.userId, userId)))
    .limit(1);
  return result[0] || null;
}

// Bank account queries
export async function findUniqueBankAccount(id: string) {
  const result = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
  return result[0] || null;
}

export async function findBankAccountByNameAndUserId(name: string, userId: string) {
  const result = await db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.name, name), eq(bankAccounts.userId, userId)))
    .limit(1);
  return result[0] || null;
}

// Transaction queries
export async function findUniqueTransaction(id: string) {
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result[0] || null;
}

export async function findTransactionByUserIdAndLunchMoneyId(userId: string, lunchMoneyId: string) {
  if (!lunchMoneyId) return null;
  
  const result = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.lunchMoneyId, lunchMoneyId)
      )
    )
    .limit(1);
  return result[0] || null;
}

// Training job queries
export async function findUniqueTrainingJob(id: string) {
  const result = await db.select().from(trainingJobs).where(eq(trainingJobs.id, id)).limit(1);
  return result[0] || null;
}

export async function findLatestTrainingJobByUserId(userId: string) {
  const result = await db
    .select()
    .from(trainingJobs)
    .where(eq(trainingJobs.userId, userId))
    .orderBy(trainingJobs.createdAt)
    .limit(1);
  return result[0] || null;
}

// Classification job queries
export async function findUniqueClassificationJob(id: string) {
  const result = await db
    .select()
    .from(classificationJobs)
    .where(eq(classificationJobs.id, id))
    .limit(1);
  return result[0] || null;
}

export async function findLatestClassificationJobByUserId(userId: string) {
  const result = await db
    .select()
    .from(classificationJobs)
    .where(eq(classificationJobs.userId, userId))
    .orderBy(classificationJobs.createdAt)
    .limit(1);
  return result[0] || null;
}

// Monthly aggregate queries
export async function findUniqueMonthlyAggregate(id: string) {
  const result = await db
    .select()
    .from(monthlyAggregates)
    .where(eq(monthlyAggregates.id, id))
    .limit(1);
  return result[0] || null;
}

export async function findMonthlyAggregateByUserIdAndMonth(userId: string, month: Date) {
  const result = await db
    .select()
    .from(monthlyAggregates)
    .where(
      and(
        eq(monthlyAggregates.userId, userId),
        eq(monthlyAggregates.month, month)
      )
    )
    .limit(1);
  return result[0] || null;
}

// Category expense queries
export async function findUniqueCategoryExpense(id: string) {
  const result = await db
    .select()
    .from(categoryExpenses)
    .where(eq(categoryExpenses.id, id))
    .limit(1);
  return result[0] || null;
}

export async function findCategoryExpenseByMonthlyAggregateIdAndCategoryId(
  monthlyAggregateId: string,
  categoryId: string
) {
  const result = await db
    .select()
    .from(categoryExpenses)
    .where(
      and(
        eq(categoryExpenses.monthlyAggregateId, monthlyAggregateId),
        eq(categoryExpenses.categoryId, categoryId)
      )
    )
    .limit(1);
  return result[0] || null;
}

// Create a new record with ID
export function createId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 