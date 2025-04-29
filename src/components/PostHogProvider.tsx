"use client";

import { FC, ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useSession } from "next-auth/react";
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
  // Use next-auth session instead of commented-out Auth0
  const { data: session, status } = useSession();

  useEffect(() => {
    // Identify the user to PostHog when the session is loaded
    if (status === "authenticated" && session?.user) {
      posthog.identify(
        session.user.email ?? session.user.id, // Use email as primary ID, fallback to id if needed
        { 
          // Add any other user properties you want to track
          email: session.user.email, 
          name: session.user.name, 
        }
      );
    } else if (status === "unauthenticated") {
      // Reset PostHog identification when the user logs out
      posthog.reset();
    }
    // Do nothing while status === 'loading'
  }, [session, status]);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
};

export default PostHogProviderWrapper;
