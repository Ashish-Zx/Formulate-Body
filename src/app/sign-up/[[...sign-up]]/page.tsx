import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default async function SignUpPage() {
  if (HAS_CLERK) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) redirect("/app");
  }

  if (!HAS_CLERK) {
    return (
      <div className="flex justify-center py-12 text-sm text-muted-foreground">
        Authentication is not configured for this deployment.
      </div>
    );
  }

  const { SignUp } = await import("@clerk/nextjs");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
            <Activity className="h-4 w-4" />
          </span>
          Formulate
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free forever. No credit card.</p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <SignUp appearance={{ variables: { colorPrimary: "#16a34a" } }} fallbackRedirectUrl="/app" />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-green-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
