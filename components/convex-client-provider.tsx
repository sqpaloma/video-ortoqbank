"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkRedirectUrl = process.env.NEXT_PUBLIC_CLERK_REDIRECT_URL;

  if (!clerkPublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable",
    );
  }

  if (!clerkRedirectUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_REDIRECT_URL environment variable",
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      localization={ptBR}
      afterSignOutUrl={clerkRedirectUrl}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
