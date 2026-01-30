"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/nextjs";

export default function TestClientAuthPage() {
  const { isLoaded: isAuthLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    issuer?: string;
    audience?: string;
    error?: string;
  } | null>(null);

  // Client-side Convex query - uses ConvexProviderWithClerk automatically
  const currentUser = useQuery(api.users.current);

  // Debug: manually fetch and decode the token
  useEffect(() => {
    async function fetchTokenInfo() {
      if (!isSignedIn) {
        setTokenInfo({ hasToken: false, error: "Not signed in" });
        return;
      }

      try {
        const token = await getToken({ template: "convex" });
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setTokenInfo({
            hasToken: true,
            issuer: payload.iss,
            audience: payload.aud,
          });
        } else {
          setTokenInfo({
            hasToken: false,
            error: "JWT template 'convex' returned null - template might not exist!",
          });
        }
      } catch (e) {
        setTokenInfo({
          hasToken: false,
          error: `Error: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }

    if (isAuthLoaded) {
      fetchTokenInfo();
    }
  }, [isAuthLoaded, isSignedIn, getToken]);

  return (
    <div className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Client-Side Auth Test (Outside Dashboard)</h1>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-semibold text-blue-800">Clerk Status:</h2>
        <p>Auth Loaded: {isAuthLoaded ? "Yes" : "No"}</p>
        <p>Signed In: {isSignedIn ? "Yes" : "No"}</p>
        <p>User ID: {userId || "N/A"}</p>
        <p>Email: {clerkUser?.primaryEmailAddress?.emailAddress || "N/A"}</p>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded">
        <h2 className="font-semibold text-purple-800">JWT Token Info (template: &apos;convex&apos;):</h2>
        {tokenInfo === null ? (
          <p>Loading token info...</p>
        ) : tokenInfo.hasToken ? (
          <>
            <p className="text-green-600">✅ Token received</p>
            <p>Issuer (iss): <code className="bg-white px-1">{tokenInfo.issuer}</code></p>
            <p>Audience (aud): <code className="bg-white px-1">{tokenInfo.audience}</code></p>
            <p className="mt-2 text-sm">
              Expected in Convex auth.config: domain=&quot;https://clerk.ortoclub.com&quot;, applicationID=&quot;convex&quot;
            </p>
            <p className={tokenInfo.issuer === "https://clerk.ortoclub.com" ? "text-green-600" : "text-red-600"}>
              Issuer match: {tokenInfo.issuer === "https://clerk.ortoclub.com" ? "✅ YES" : "❌ NO"}
            </p>
            <p className={tokenInfo.audience === "convex" ? "text-green-600" : "text-red-600"}>
              Audience match: {tokenInfo.audience === "convex" ? "✅ YES" : "❌ NO"}
            </p>
          </>
        ) : (
          <p className="text-red-500">❌ {tokenInfo.error}</p>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-semibold text-yellow-800">Environment:</h2>
        <p>NEXT_PUBLIC_CONVEX_URL: <code className="bg-white px-1 text-xs">{process.env.NEXT_PUBLIC_CONVEX_URL}</code></p>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <h2 className="font-semibold text-green-800">Convex Query Result (api.users.current):</h2>
        {currentUser === undefined ? (
          <p className="text-yellow-600">Loading from Convex...</p>
        ) : currentUser === null ? (
          <p className="text-red-500">❌ User not found in Convex (returned null) - Check console for auth errors!</p>
        ) : (
          <>
            <p className="text-green-600">✅ User found!</p>
            <pre className="text-sm overflow-auto bg-white p-2 rounded mt-2">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </>
        )}
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded">
        <h2 className="font-semibold">Debug Checklist:</h2>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>Check browser console for detailed auth logs</li>
          <li>Verify JWT template &apos;convex&apos; exists in Clerk Dashboard</li>
          <li>Verify Convex auth.config.ts has correct domain</li>
          <li>Verify NEXT_PUBLIC_CONVEX_URL points to production deployment</li>
        </ul>
      </div>
    </div>
  );
}
