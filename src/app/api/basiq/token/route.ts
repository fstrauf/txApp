import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get request body (if we need user info)
    const body = await request.json().catch(() => ({}));
    const email = body.email || "user@example.com";
    const mobile = body.mobile || "+61400000000";

    // Step 2: Authenticate - Get server token
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

    // Step 3: Create a user or get existing user
    const createUserResponse = await fetch("https://au-api.basiq.io/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverTokenData.access_token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        mobile,
      }),
    });

    const userData = await createUserResponse.json();
    
    // Check if we got a valid user ID
    if (!userData.id) {
      console.error("User creation failed:", userData);
      return NextResponse.json(
        { error: "Failed to create or retrieve user" },
        { status: 500 }
      );
    }

    const userId = userData.id;

    // Step 4: Get client token bound to the user ID
    const clientTokenResponse = await fetch("https://au-api.basiq.io/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.BASIQ_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": "3.0",
      },
      body: `scope=CLIENT_ACCESS&userId=${userId}`,
    });

    const clientTokenData = await clientTokenResponse.json();

    if (!clientTokenData.access_token) {
      throw new Error("Failed to get client token");
    }

    return NextResponse.json({ 
      clientToken: clientTokenData.access_token,
      userId
    });
  } catch (error) {
    console.error("Error in token generation:", error);
    return NextResponse.json(
      { error: "Failed to generate token", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 