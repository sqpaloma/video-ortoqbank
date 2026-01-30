import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Production: clerk.ortoclub.com
      domain: "https://clerk.ortoclub.com",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
