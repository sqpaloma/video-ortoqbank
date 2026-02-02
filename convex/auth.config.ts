import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Production: clerk.ortoclub.com
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
