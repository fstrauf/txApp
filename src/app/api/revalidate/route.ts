import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, tag, secret } = body;

    // Verify the secret to prevent unauthorized revalidation
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (path) {
      // Revalidate specific path
      revalidatePath(path);
      console.log(`[Revalidation] Revalidated path: ${path}`);
    }

    if (tag) {
      // Revalidate by tag
      revalidateTag(tag);
      console.log(`[Revalidation] Revalidated tag: ${tag}`);
    }

    // Also revalidate the sitemap
    revalidatePath('/sitemap.xml');

    return NextResponse.json({ 
      message: 'Revalidation successful',
      revalidated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Revalidation] Error:', error);
    return NextResponse.json(
      { error: 'Error revalidating' }, 
      { status: 500 }
    );
  }
}

// For manual testing - remove in production
export async function GET() {
  return NextResponse.json({ 
    message: 'Revalidation endpoint is active. Use POST with secret.',
    paths: [
      '/blog/[slug]',
      '/sitemap.xml',
      '/blog'
    ]
  });
}
