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
  // Temporarily commented out Auth0 functionality
  // const { user } = useUser();
  const user = null;

  useEffect(() => {
    // Identify user if logged in with Auth0 (using sub as distinct ID)
    if (user && user.sub) {
      posthog.identify(user.sub, {
        email: user.email,
      });
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
