"use client";

import { FC, ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
// Temporarily commented out until Auth0 is properly set up
// import { useUser } from "@auth0/nextjs-auth0/client";
import PostHogPageView from "./PostHogPageView";

// Check that PostHog is client-side (browser)
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Enable debug mode in development
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

interface Props {
  children: ReactNode;
}

const PostHogProviderWrapper: FC<Props> = ({ children }) => {
  // Currently not using Auth0 - will be implemented later
  const user = null;

  useEffect(() => {
    // This will be re-implemented when Auth0 integration is complete
    // For now, we'll use session-based identity
    if (user) {
      posthog.reset(); // Clear any previous identity
    }
  }, [user]);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
};

export default PostHogProviderWrapper;
