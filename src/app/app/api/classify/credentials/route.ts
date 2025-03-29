import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClassifyServiceClient } from '@/lib/classify-service';

export async function GET() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasApiKey: !!user.classifyApiKey,
      isValid: user.classifyApiKey ? await validateApiKey(user.classifyApiKey) : false
    });
  } catch (error) {
    console.error('Error fetching classification service credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classification service credentials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Validate the API key before saving
    const isValid = await validateApiKey(apiKey);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid classification service API key' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { classifyApiKey: apiKey },
    });
    
    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error saving classification service credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save classification service credentials' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { classifyApiKey: null },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing classification service credentials:', error);
    return NextResponse.json(
      { error: 'Failed to remove classification service credentials' },
      { status: 500 }
    );
  }
}

// Helper function to validate the classification API key
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new ClassifyServiceClient({
      apiKey,
      serviceUrl: process.env.CLASSIFY_SERVICE_URL || 'http://localhost:5001',
    });
    
    return await client.validateApiKey();
  } catch (error) {
    console.error('Error validating classification API key:', error);
    return false;
  }
} 