import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

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

    // Step 5: Check job status
    const jobResponse = await fetch(`https://au-api.basiq.io/jobs/${jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serverTokenData.access_token}`,
        "Accept": "application/json",
      },
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      throw new Error(`Failed to get job: ${errorText}`);
    }

    const jobData = await jobResponse.json();

    // Step 6: If job is complete, fetch account data
    if (
      jobData.steps &&
      jobData.steps.every((step: any) => step.status === "success")
    ) {
      // Fetch account data for the user
      const accountsResponse = await fetch(
        `https://au-api.basiq.io/users/${userId}/accounts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${serverTokenData.access_token}`,
            "Accept": "application/json",
          },
        }
      );

      if (!accountsResponse.ok) {
        console.warn("Job completed but could not fetch accounts");
        // We'll still return the job data even if accounts fetch fails
      } else {
        const accountsData = await accountsResponse.json();
        return NextResponse.json({
          ...jobData,
          accounts: accountsData,
        });
      }
    }

    return NextResponse.json(jobData);
  } catch (error) {
    console.error("Error checking job status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check job status", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 