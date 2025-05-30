import { NextRequest, NextResponse } from 'next/server';

const AKAHU_BASE_URL = 'https://api.akahu.io';

export async function POST(request: NextRequest) {
  try {
    const appToken = process.env.AKAHU_APP_TOKEN;
    const userToken = process.env.AKAHU_USER_TOKEN;

    if (!appToken || !userToken) {
      return NextResponse.json(
        { error: 'Akahu tokens not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { accountIds, months = 12 } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Account IDs are required' },
        { status: 400 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const allTransactions = [];

    // Fetch transactions for each account
    for (const accountId of accountIds) {
      let cursor = undefined;
      let hasMore = true;

      while (hasMore && allTransactions.length < 1000) {
        const url = new URL(`${AKAHU_BASE_URL}/v1/accounts/${accountId}/transactions`);
        url.searchParams.append('start', startDate.toISOString().split('T')[0]);
        url.searchParams.append('end', endDate.toISOString().split('T')[0]);
        if (cursor) {
          url.searchParams.append('cursor', cursor);
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${userToken}`,
            'X-Akahu-ID': appToken,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Akahu transactions API error (${response.status}):`, errorText);
          return NextResponse.json(
            { error: `Akahu API error: ${response.status}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        allTransactions.push(...(data.items || []));
        
        hasMore = !!data.cursor?.next;
        cursor = data.cursor?.next;
      }
    }

    // Sort by date (most recent first)
    allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error('Akahu transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
