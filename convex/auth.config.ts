import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Production: custom domain
      domain: "https://clerk.ortoclub.com",
      applicationID: "convex",
    },
    {
      // Production: Clerk's hosted domain (backup)
      domain: "https://sunny-gannet-96.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
