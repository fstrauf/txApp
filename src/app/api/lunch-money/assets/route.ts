import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth';
import { findUserByEmail } from '@/db/utils';
import { decryptApiKey } from '@/lib/encryption';

const LUNCH_MONEY_ASSETS_API_URL = 'https://dev.lunchmoney.app/v1/assets';
const LUNCH_MONEY_CRYPTO_API_URL = 'https://dev.lunchmoney.app/v1/crypto';

// Function to fetch assets from Lunch Money API
async function fetchLunchMoneyAssets(apiKey: string): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(LUNCH_MONEY_ASSETS_API_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = { error: `Failed to fetch assets from Lunch Money (${response.status})` };
      try {
        errorBody = await response.json();
      } catch (e) {}
      console.error('Lunch Money API Error (Assets):', response.status, errorBody);
      throw new Error(errorBody.error || `Failed to fetch assets (${response.status})`);
    }

    const data = await response.json();
    return data.assets || [];
  } catch (error) {
    console.error('Error fetching assets from Lunch Money:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching assets from Lunch Money');
    }
    throw error;
  }
}

// Function to fetch crypto assets from Lunch Money API
async function fetchLunchMoneyCrypto(apiKey: string): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(LUNCH_MONEY_CRYPTO_API_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = { error: `Failed to fetch crypto from Lunch Money (${response.status})` };
      try {
        errorBody = await response.json();
      } catch (e) {}
      console.error('Lunch Money API Error (Crypto):', response.status, errorBody);
      throw new Error(errorBody.error || `Failed to fetch crypto (${response.status})`);
    }

    const data = await response.json();
    return data.crypto || []; // Note: response key is 'crypto'
  } catch (error) {
    console.error('Error fetching crypto from Lunch Money:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching crypto from Lunch Money');
    }
    throw error;
  }
}

// GET handler to fetch assets and calculate total savings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await findUserByEmail(session.user.email);
    
    const encryptedApiKey = user?.lunchMoneyApiKey;
    if (!encryptedApiKey) {
      return NextResponse.json({ error: 'Lunch Money API key not configured.' }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = decryptApiKey(encryptedApiKey);
    } catch (decError) {
      console.error('Failed to decrypt API key for user:', user?.id, decError);
      return NextResponse.json({ error: 'Could not process API key.' }, { status: 500 }); 
    }

    // Fetch both standard assets and crypto assets concurrently
    const [assets, cryptoAssets] = await Promise.all([
      fetchLunchMoneyAssets(apiKey),
      fetchLunchMoneyCrypto(apiKey)
    ]);

    // Calculate total savings from ALL asset types
    let totalSavings = 0;
    let assetsIncludedCount = 0;
    let cryptoIncludedCount = 0;

    // Process standard assets
    assets.forEach((asset: any) => {
      const valueToAdd = asset.to_base ?? parseFloat(asset.balance) ?? null;
      if (valueToAdd !== null && !isNaN(valueToAdd)) {
        totalSavings += valueToAdd;
        assetsIncludedCount++;
      } else {
        console.warn(`[Assets API] Skipping asset with non-numeric/null balance/to_base: ${asset.name} (ID: ${asset.id}), Type: ${asset.type_name}, Balance: ${asset.balance}, ToBase: ${asset.to_base}`);
      }
    });
    
    // Process crypto assets
    cryptoAssets.forEach((asset: any) => {
      // Crypto API also has to_base as per docs (added Feb 6, 2025)
      const valueToAdd = asset.to_base ?? parseFloat(asset.balance) ?? null;
      if (valueToAdd !== null && !isNaN(valueToAdd)) {
        totalSavings += valueToAdd;
        cryptoIncludedCount++;
      } else {
        console.warn(`[Assets API] Skipping crypto with non-numeric/null balance/to_base: ${asset.name} (ID: ${asset.id}), Currency: ${asset.currency}, Balance: ${asset.balance}, ToBase: ${asset.to_base}`);
      }
    });

    // Update log message
    console.log(`[Assets API] Calculated total savings: ${totalSavings} from ${assetsIncludedCount} standard assets and ${cryptoIncludedCount} crypto assets.`);

    return NextResponse.json({ totalSavings: totalSavings });

  } catch (error) {
    console.error('Error in GET /api/lunch-money/assets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching assets' },
      { status: 500 }
    );
  }
} 