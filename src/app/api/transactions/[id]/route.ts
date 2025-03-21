import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from 'next/server';

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { id } = params;
    const { categoryId } = await request.json();
    
    // Check if transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Update the transaction's category
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { categoryId },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction 
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transaction' },
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