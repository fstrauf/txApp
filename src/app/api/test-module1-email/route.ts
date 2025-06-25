import { NextRequest, NextResponse } from 'next/server';
import { sendModule1Access } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`[test-module1-email] Testing Module 1 email to: ${email}`);
    
    const result = await sendModule1Access({ email });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Module 1 access email sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[test-module1-email] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to check email service configuration
export async function GET() {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasFromEmail = !!process.env.FROM_EMAIL;
  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;
  
  return NextResponse.json({
    configured: hasResendKey && hasFromEmail && hasAppUrl,
    details: {
      resendKey: hasResendKey ? '✅ Set' : '❌ Missing RESEND_API_KEY',
      fromEmail: hasFromEmail ? '✅ Set' : '⚠️ Using default (set FROM_EMAIL)',
      appUrl: hasAppUrl ? '✅ Set' : '⚠️ Using default (set NEXT_PUBLIC_APP_URL)'
    }
  });
} 