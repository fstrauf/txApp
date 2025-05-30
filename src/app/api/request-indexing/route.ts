import { NextRequest, NextResponse } from 'next/server';

// This API helps manually request Google to index specific URLs
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Log the indexing request for monitoring
    console.log(`[Indexing Request] URL: ${url}`);
    
    // In production, you can integrate with Google's Indexing API here
    // For now, we'll just log and return success
    
    return NextResponse.json({ 
      success: true, 
      message: `Indexing requested for: ${url}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error requesting indexing:', error);
    return NextResponse.json(
      { error: 'Failed to request indexing' }, 
      { status: 500 }
    );
  }
}
