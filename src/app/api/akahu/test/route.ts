import { NextRequest, NextResponse } from 'next/server';

const AKAHU_BASE_URL = 'https://api.akahu.io';

export async function GET() {
  try {
    const appToken = process.env.AKAHU_APP_TOKEN;
    const userToken = process.env.AKAHU_USER_TOKEN;

    if (!appToken || !userToken) {
      return NextResponse.json(
        { error: 'Akahu tokens not configured' },
        { status: 500 }
      );
    }

    // Test connection by getting user info
    const response = await fetch(`${AKAHU_BASE_URL}/v1/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'X-Akahu-ID': appToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Akahu API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Akahu API error: ${response.status}` },
        { status: response.status }
      );
    }

    const user = await response.json();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Akahu test connection error:', error);
    return NextResponse.json(
      { error: 'Failed to test Akahu connection' },
      { status: 500 }
    );
  }
}
