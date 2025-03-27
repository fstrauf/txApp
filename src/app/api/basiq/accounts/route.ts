import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 2: Get server token
    const serverTokenResponse = await fetch("https://au-api.basiq.io/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.BASIQ_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: "scope=SERVER_ACCESS",
    });

    const serverTokenData = await serverTokenResponse.json();

    if (!serverTokenData.access_token) {
      throw new Error("Failed to get server token");
    }

    // For a real app, you would get the user ID from your auth system
    // For this demo, we'll make another call to get or create a user
    const createUserResponse = await fetch("https://au-api.basiq.io/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverTokenData.access_token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        mobile: "+61400000000",
      }),
    });

    const userData = await createUserResponse.json();
    
    if (!userData.id) {
      return NextResponse.json(
        { error: "No user found" },
        { status: 404 }
      );
    }

    // Fetch accounts for the user
    const accountsResponse = await fetch(
      `https://au-api.basiq.io/users/${userData.id}/accounts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serverTokenData.access_token}`,
          "Accept": "application/json",
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      throw new Error(`Failed to fetch accounts: ${errorText}`);
    }

    const accountsData = await accountsResponse.json();
    return NextResponse.json(accountsData);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch accounts", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 