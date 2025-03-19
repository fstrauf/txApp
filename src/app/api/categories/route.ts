import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all categories for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json(
      { 
        message: "Error fetching categories",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { message: "Name is a required field" },
        { status: 400 }
      );
    }
    
    // Check if a category with this name already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' }, // Case insensitive search
        userId: user.id
      }
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { message: "A category with this name already exists" },
        { status: 400 }
      );
    }
    
    const newCategory = await prisma.category.create({
      data: {
        name,
        isDefault: false,
        userId: user.id,
      }
    });
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("[CATEGORY_CREATE]", error);
    return NextResponse.json(
      { 
        message: "Error creating category",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 