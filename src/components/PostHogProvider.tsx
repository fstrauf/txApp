"use client";

import { FC, ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useSession } from "next-auth/react";
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
  // Use the NextAuth session hook
  const { data: session, status } = useSession();

  useEffect(() => {
    // Identify the user if authenticated, otherwise reset
    if (status === "authenticated" && session?.user) {
      posthog.identify(
        session.user.id || session.user.email!, // Use ID if available, fallback to email as distinct ID
        {
          // Set user properties, including email for flag evaluation
          email: session.user.email,
          name: session.user.name, 
          // Add other relevant user properties if needed
        }
      );
    } else if (status === "unauthenticated") {
      // Reset PostHog identity when user logs out or is not logged in
      posthog.reset();
    }
    // Depend on session status and user object to re-run when login/logout happens
  }, [status, session]);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
};

export default PostHogProviderWrapper;
