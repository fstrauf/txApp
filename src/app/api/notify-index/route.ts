import { NextRequest, NextResponse } from 'next/server'
import { notifyAllPages, notifyIndexNow } from '@/lib/indexnow'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.urls && Array.isArray(body.urls)) {
      // Notify specific URLs
      await notifyIndexNow(body.urls)
      return NextResponse.json({ 
        success: true, 
        message: `Notified search engines about ${body.urls.length} URLs` 
      })
    } else {
      // Notify all important pages
      await notifyAllPages()
      return NextResponse.json({ 
        success: true, 
        message: 'Notified search engines about all important pages' 
      })
    }
  } catch (error) {
    console.error('Index notification error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to notify search engines' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger index notifications',
    endpoints: {
      'POST /api/notify-index': 'Notify search engines about content updates',
      'body': {
        'urls': ['array of URLs to notify about (optional)']
      }
    }
  })
}
