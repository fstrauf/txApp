import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to get transaction details by ID
async function getTransactionWithAuth(
  id: string,
  email: string | null | undefined
) {
  if (!email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      category: true,
      bankAccount: true,
    },
  });

  if (!transaction) {
    return { error: "Transaction not found", status: 404 };
  }

  if (transaction.userId !== user.id) {
    return { error: "Unauthorized", status: 403 };
  }

  return { transaction, user };
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract id from params
    const id = context.params.id;
    
    const session = await getServerSession(authConfig);
    const result = await getTransactionWithAuth(
      id,
      session?.user?.email
    );

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    const { transaction, user } = result;
    const body = await request.json();
    const { description, amount, date, categoryId, type } = body;

    if (type && !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { message: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Calculate financial impact on account
    let financialImpact = 0;
    
    // For existing transaction, reverse its previous effect on balance
    if (transaction.type === 'income') {
      financialImpact -= transaction.amount; // Remove previous income amount
    } else {
      financialImpact += transaction.amount; // Add back previous expense amount
    }
    
    // Add the new effect on balance
    const newType = type || transaction.type;
    if (newType === 'income') {
      financialImpact += amount; // Add new income amount
    } else {
      financialImpact -= amount; // Subtract new expense amount
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount,
        type: type || undefined, // Only update if provided
        date: new Date(date),
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        bankAccount: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    // Update bank account balance if there's a financial impact
    if (financialImpact !== 0) {
      await prisma.bankAccount.update({
        where: { id: transaction.bankAccountId },
        data: {
          balance: {
            increment: financialImpact,
          },
        },
      });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("[TRANSACTION_UPDATE]", error);
    return NextResponse.json(
      {
        message: "Error updating transaction",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Extract id from params
    const id = context.params.id;
    
    const session = await getServerSession(authConfig);
    const result = await getTransactionWithAuth(
      id,
      session?.user?.email
    );

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    const { transaction } = result;

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    // Update bank account balance based on transaction type
    let balanceChange = 0;
    if (transaction.type === 'income') {
      balanceChange = -transaction.amount; // Reduce balance by income amount
    } else {
      balanceChange = transaction.amount; // Increase balance by expense amount (reversing the expense)
    }

    await prisma.bankAccount.update({
      where: { id: transaction.bankAccountId },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("[TRANSACTION_DELETE]", error);
    return NextResponse.json(
      {
        message: "Error deleting transaction",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 