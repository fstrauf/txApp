"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface UseEmailSignupOptions {
  source: string;
  tags: string[];
  onSuccess?: () => void;
  successDelay?: number;
}

interface EmailSignupState {
  email: string;
  isLoading: boolean;
  error: string;
  success: boolean;
}

export function useEmailSignup({ source, tags, onSuccess, successDelay = 1500 }: UseEmailSignupOptions) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitEmail = async (customEmail?: string) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // Use custom email, user's session email, or input email
    const emailToSend = customEmail || session?.user?.email || email;
    
    if (!emailToSend) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch("/api/createEmailContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailToSend,
          source,
          tags
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // Call onSuccess callback after delay if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, successDelay);
        }
        
        return true;
      } else {
        setError(data.error || "Failed to subscribe. Please try again.");
        return false;
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    setIsLoading(false);
  };

  const state: EmailSignupState = {
    email,
    isLoading,
    error,
    success
  };

  return {
    state,
    actions: {
      setEmail,
      submitEmail,
      resetState
    },
    userEmail: session?.user?.email
  };
}
