'use client'

import { ReactNode, useEffect, useCallback } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

console.log("[Convex Provider] NEXT_PUBLIC_CONVEX_URL:", CONVEX_URL)

if (!CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

const convex = new ConvexReactClient(CONVEX_URL)

// Debug wrapper to log everything about authentication
function useAuthWithDebug() {
  const auth = useAuth()
  
  const debugToken = useCallback(async () => {
    console.log("========== CLIENT AUTH DEBUG ==========")
    console.log("[Client] Convex URL:", CONVEX_URL)
    console.log("[Client] Auth state:", {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn,
      userId: auth.userId,
    })
    
    if (!auth.isLoaded) {
      console.log("[Client] Auth not loaded yet")
      return
    }
    
    if (!auth.isSignedIn) {
      console.log("[Client] User not signed in")
      return
    }
    
    // Try to get the convex template token
    try {
      console.log("[Client] Attempting to get token with template: 'convex'")
      const token = await auth.getToken({ template: "convex" })
      
      if (token) {
        console.log("[Client] ✅ Token received from Clerk")
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          console.log("[Client] Token payload:", JSON.stringify(payload, null, 2))
          console.log("[Client] Token issuer (iss):", payload.iss)
          console.log("[Client] Token audience (aud):", payload.aud)
          console.log("[Client] Token subject (sub):", payload.sub)
          console.log("[Client] Token expires:", new Date(payload.exp * 1000).toISOString())
        } catch (decodeErr) {
          console.error("[Client] Failed to decode token:", decodeErr)
        }
      } else {
        console.error("[Client] ❌ getToken({ template: 'convex' }) returned NULL!")
        console.error("[Client] This means the JWT template 'convex' does not exist in Clerk!")
        console.log("[Client] Trying without template to see default token...")
        
        const defaultToken = await auth.getToken()
        if (defaultToken) {
          const payload = JSON.parse(atob(defaultToken.split(".")[1]))
          console.log("[Client] Default token issuer:", payload.iss)
          console.log("[Client] Default token audience:", payload.aud)
        }
      }
    } catch (e) {
      console.error("[Client] ❌ Error getting token:", e)
    }
    console.log("========================================")
  }, [auth])
  
  useEffect(() => {
    debugToken()
  }, [debugToken])
  
  return auth
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuthWithDebug}>
      {children}
    </ConvexProviderWithClerk>
  )
} 