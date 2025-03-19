import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to get category with authorization check
async function getCategoryWithAuth(
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

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    return { error: "Category not found", status: 404 };
  }

  if (category.userId !== user.id) {
    return { error: "Unauthorized", status: 403 };
  }

  return { category, user };
}

// GET a single category by ID
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const session = await getServerSession(authConfig);
    const result = await getCategoryWithAuth(id, session?.user?.email);

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.category);
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return NextResponse.json(
      {
        message: "Error fetching category",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update a category
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const session = await getServerSession(authConfig);
    const result = await getCategoryWithAuth(id, session?.user?.email);

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    const { category, user } = result;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "No fields to update provided" },
        { status: 400 }
      );
    }

    // If name is changing, check for duplicates
    if (name && name !== category.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          userId: user.id,
          id: { not: id } // exclude current category
        }
      });

      if (existingCategory) {
        return NextResponse.json(
          { message: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("[CATEGORY_UPDATE]", error);
    return NextResponse.json(
      {
        message: "Error updating category",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const session = await getServerSession(authConfig);
    const result = await getCategoryWithAuth(id, session?.user?.email);

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    const { category, user } = result;

    // Don't allow deletion of default categories
    if (category.isDefault) {
      return NextResponse.json(
        { message: "Cannot delete default category" },
        { status: 400 }
      );
    }

    // Check if category is used in any transactions
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId: id,
        userId: user.id
      }
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete category that is used in transactions", count: transactionCount },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error);
    return NextResponse.json(
      {
        message: "Error deleting category",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 