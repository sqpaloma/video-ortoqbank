import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/categories(.*)",
  "/course(.*)",
  "/favorites(.*)",
  "/profile(.*)",
  "/purchase(.*)", // Precisa estar logado para ver página de compra
  "/server(.*)",
  "/units(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // AUTH ONLY - Check authentication first
  await auth.protect();

  // Role-based authorization is enforced in Server Components
  // for /admin routes using requireAdminServer() utility
  // This is more efficient than checking roles in middleware
  // as it avoids additional Convex queries on every request

  // NÃO checa acesso pago aqui
  // Isso acontece no Convex / Server Components

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
