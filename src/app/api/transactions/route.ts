import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await request.json();
    const { amount, description, type, date, categoryId } = body;

    if (!type || !['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    // Create a default bank account for the user if none exists
    let bankAccount = await prisma.bankAccount.findFirst({
      where: { userId: user.id },
    });

    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          name: "Default Account",
          type: "Checking",
          userId: user.id,
        },
      });
    }

    // Find or create appropriate default category if none provided
    let category;
    
    if (categoryId) {
      // Verify the category exists and belongs to the user
      category = await prisma.category.findFirst({
        where: { 
          id: categoryId,
          userId: user.id
        },
      });
      
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    } else {
      // Use or create a default category
      const defaultCategoryName = type === "income" ? "Uncategorized Income" : "Uncategorized Expense";
      
      category = await prisma.category.findFirst({
        where: { 
          name: defaultCategoryName,
          userId: user.id
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: defaultCategoryName,
            isDefault: true,
            userId: user.id,
          },
        });
      }
    }

    // Create transaction with the proper amount and type
    const transaction = await prisma.transaction.create({
      data: {
        amount: Math.abs(amount), // Always store positive amount
        type,  // Store the transaction type
        description,
        date: new Date(date),
        bankAccountId: bankAccount.id,
        categoryId: category.id,
        userId: user.id,
      },
      include: {
        category: true,
        bankAccount: {
          select: { name: true }
        }
      }
    });

    // Update bank account balance
    await prisma.bankAccount.update({
      where: { id: bankAccount.id },
      data: {
        balance: {
          increment: type === "income" ? Math.abs(amount) : -Math.abs(amount),
        },
      },
    });

    return NextResponse.json(transaction);
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 