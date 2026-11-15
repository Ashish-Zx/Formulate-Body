import { clerkMiddleware } from "@clerk/nextjs/server";

// Bare session reader — no route protection here.
// Auth enforcement is done per-page via requireUser() in src/lib/auth.ts,
// which redirects to /sign-in when Clerk is configured and the user is signed out.
// clerkMiddleware() MUST run so that auth() in Server Components works correctly.
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
