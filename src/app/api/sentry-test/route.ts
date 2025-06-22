import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Add a breadcrumb
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Sentry test endpoint accessed',
      level: 'info',
    });

    return NextResponse.json({
      message: 'Sentry test endpoint working! Check your Sentry dashboard.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Intentionally throw an error to test Sentry
    throw new Error('This is a test error from the API route!');
  } catch (error) {
    // Capture the error with additional context
    Sentry.captureException(error, {
      tags: {
        section: 'api',
        endpoint: '/api/sentry-test',
      },
      extra: {
        method: 'POST',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'Test error captured by Sentry!',
        message: 'Check your Sentry dashboard for the error report.'
      },
      { status: 500 }
    );
  }
} 