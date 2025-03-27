"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface BasiqTokenResponse {
  clientToken: string;
  userId: string;
}

export default function BankingPage() {
  const [clientToken, setClientToken] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're returning from Basiq consent with a jobId
    const jobIdParam = searchParams.get("jobId");
    if (jobIdParam) {
      setJobId(jobIdParam);
      checkJobStatus(jobIdParam);
    }
  }, [searchParams]);

  const checkJobStatus = async (jobId: string) => {
    try {
      setIsLoading(true);
      // First we need to get a server token to check the job
      const tokenResponse = await fetch("/api/basiq/token", {
        method: "POST",
      });
      
      if (!tokenResponse.ok) {
        throw new Error("Failed to get token for job status check");
      }
      
      const tokenData = await tokenResponse.json();
      
      // Now check the job status with the received userId
      const response = await fetch(`/api/basiq/jobs/${jobId}?userId=${tokenData.userId}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error("Failed to check job status");
      }
      
      const data = await response.json();
      
      // Check if all steps are completed successfully
      const allStepsCompleted = data.steps && 
        data.steps.every((step: any) => step.status === "success");
      
      if (allStepsCompleted) {
        setConnected(true);
      } else {
        // If not all steps are completed, we might want to poll again
        setTimeout(() => checkJobStatus(jobId), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check job status");
    } finally {
      setIsLoading(false);
    }
  };

  const getClientToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/basiq/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // You can pass user details from your auth system here
          email: "user@example.com",
          mobile: "+61400000000",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get client token");
      }
      
      const data: BasiqTokenResponse = await response.json();
      
      if (data.clientToken) {
        setClientToken(data.clientToken);
        setUserId(data.userId);
        
        // Redirect to Basiq consent UI
        window.location.href = `https://consent.basiq.io/home?token=${data.clientToken}`;
      } else {
        throw new Error("No client token received");
      }
    } catch (error) {
      console.error("Error getting client token:", error);
      setError(error instanceof Error ? error.message : "Failed to connect to banking services");
    } finally {
      setIsLoading(false);
    }
  };

  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-4 text-green-600">Connection Successful!</h1>
        <p className="mb-8 text-lg">Your bank account has been successfully connected.</p>
        <Link 
          href="/banking/accounts" 
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          View Your Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Connect Your Bank Account</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {jobId && !connected && (
        <div className="mb-8">
          <p className="text-lg mb-2">Processing your connection...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full w-1/2 animate-pulse"></div>
          </div>
        </div>
      )}
      
      {!jobId && !connected && (
        <button
          onClick={getClientToken}
          disabled={isLoading}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Connect Bank Account"}
        </button>
      )}
    </div>
  );
} 