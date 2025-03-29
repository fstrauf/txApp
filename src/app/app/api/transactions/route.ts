import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/db";
import { bankAccounts, categories, transactions } from "@/db/schema";
import { 
  createId, 
  findUserByEmail, 
  findBankAccountByNameAndUserId, 
  findCategoryByNameAndUserId 
} from "@/db/utils";
import { and, desc, eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user ID
    const user = await findUserByEmail(session.user.email);

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await request.json();
    const { amount, description, type, date, categoryId } = body;

    if (!type || !['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    // Create a default bank account for the user if none exists
    let bankAccount = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, user.id))
      .limit(1)
      .then(results => results[0] || null);

    if (!bankAccount) {
      const newBankAccount = {
        id: createId(),
        name: "Default Account",
        type: "Checking",
        userId: user.id,
        balance: "0", // Use string for decimal values
      };
      
      [bankAccount] = await db
        .insert(bankAccounts)
        .values(newBankAccount)
        .returning();
    }

    // Find or create appropriate default category if none provided
    let category;
    
    if (categoryId) {
      // Verify the category exists and belongs to the user
      category = await db
        .select()
        .from(categories)
        .where(and(
          eq(categories.id, categoryId),
          eq(categories.userId, user.id)
        ))
        .limit(1)
        .then(results => results[0] || null);
      
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    } else {
      // Use or create a default category
      const defaultCategoryName = type === "income" ? "Uncategorized Income" : "Uncategorized Expense";
      
      category = await findCategoryByNameAndUserId(defaultCategoryName, user.id);

      if (!category) {
        const newCategory = {
          id: createId(),
          name: defaultCategoryName,
          isDefault: true,
          userId: user.id,
        };
        
        [category] = await db
          .insert(categories)
          .values(newCategory)
          .returning();
      }
    }

    // Create transaction with the proper amount and type
    const newTransaction = {
      id: createId(),
      amount: String(Math.abs(amount)), // Convert to string for decimal column
      type,
      description,
      date: new Date(date),
      bankAccountId: bankAccount.id,
      categoryId: category.id,
      userId: user.id,
      isReconciled: false,
    };
    
    const [transaction] = await db
      .insert(transactions)
      .values(newTransaction)
      .returning();
    
    // Get related category and bank account for response
    const transactionResult = await db
      .select({
        transaction: transactions,
        category: categories,
        bankAccountName: bankAccounts.name,
      })
      .from(transactions)
      .where(eq(transactions.id, transaction.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
      .limit(1);

    const transactionWithRelations = transactionResult[0] ? {
      ...transactionResult[0].transaction,
      category: transactionResult[0].category,
      bankAccount: {
        name: transactionResult[0].bankAccountName,
      },
    } : transaction;

    // Update bank account balance
    const currentBalance = Number(bankAccount.balance) || 0;
    const amountValue = Math.abs(Number(amount));
    const newBalance = type === "income" 
      ? currentBalance + amountValue 
      : currentBalance - amountValue;
      
    await db
      .update(bankAccounts)
      .set({
        balance: String(newBalance),
      })
      .where(eq(bankAccounts.id, bankAccount.id));

    return NextResponse.json(transactionWithRelations);
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user ID
    const user = await findUserByEmail(session.user.email);

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const results = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        isReconciled: transactions.isReconciled,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        bankAccountId: transactions.bankAccountId,
        bankAccountName: bankAccounts.name,
      })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
      .orderBy(desc(transactions.date));
      
    // Transform the results to match the expected format
    const formattedTransactions = results.map(row => ({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: row.amount,
      type: row.type,
      isReconciled: row.isReconciled,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      bankAccountId: row.bankAccountId,
      categoryId: row.categoryId,
      category: row.categoryId ? {
        id: row.categoryId,
        name: row.categoryName,
      } : null,
      bankAccount: row.bankAccountId ? {
        id: row.bankAccountId,
        name: row.bankAccountName,
      } : null,
    }));
    
    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 