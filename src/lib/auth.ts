import { redirect } from "next/navigation";
import { DEFAULT_USER_ID } from "@/lib/constants";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export function clerkIsConfigured(): boolean {
  return HAS_CLERK;
}

export async function getAuthState(): Promise<{
  clerkEnabled: boolean;
  userId: string | null;
}> {
  if (!HAS_CLERK) return { clerkEnabled: false, userId: null };
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return { clerkEnabled: true, userId: userId ?? null };
  } catch {
    return { clerkEnabled: true, userId: null };
  }
}

// Returns the signed-in Clerk userId when Clerk is configured, otherwise the local single-user id.
export async function getUserId(): Promise<string> {
  const { userId } = await getAuthState();
  return userId ?? DEFAULT_USER_ID;
}

// Guard for protected pages: redirects to sign-in when Clerk is configured but the user is signed out.
export async function requireUser(): Promise<string> {
  const { clerkEnabled, userId } = await getAuthState();
  if (clerkEnabled && !userId) redirect("/sign-in");
  return userId ?? DEFAULT_USER_ID;
}
