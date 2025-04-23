import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = 'fra1';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
} 