import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const appearance = {
  variables: {
    colorPrimary: "#16a34a",
    colorBackground: "#0d0d0d",
    colorInputBackground: "#181818",
    colorText: "#e5e7eb",
    colorTextSecondary: "#a1a1aa",
    colorNeutral: "#a1a1aa",
    borderRadius: "0.6rem",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      boxShadow: "none",
      background: "transparent",
      border: "1px solid rgb(255 255 255 / 0.08)",
    },
    header: { display: "none" },
    socialButtonsBlockButton: {
      background: "rgb(255 255 255 / 0.04)",
      border: "1px solid rgb(255 255 255 / 0.1)",
      color: "#e5e7eb",
    },
    socialButtonsBlockButtonText: { color: "#e5e7eb" },
    formFieldInput: {
      background: "rgb(255 255 255 / 0.04)",
      border: "1px solid rgb(255 255 255 / 0.12)",
      color: "#e5e7eb",
    },
    formFieldLabel: { color: "#d1d5db" },
    formButtonPrimary: {
      background: "#16a34a",
      ":hover": { background: "#15803d" },
    },
    dividerLine: { background: "rgb(255 255 255 / 0.12)" },
    footerAction: { color: "#a1a1aa" },
    footerActionLink: { color: "#4ade80" },
  },
};

export default async function SignInPage() {
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

  const { SignIn } = await import("@clerk/nextjs");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-green-600 via-green-700 to-emerald-900 p-8 text-white md:flex">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">F</span>
              Formulate
            </div>
            <p className="mt-6 text-2xl font-bold leading-snug">
              Your AI coach for a stronger, leaner you.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Spine-safe, RPE-based programming</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> No-fish South Asian meal presets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> AI coach & 7-day macro log</li>
            </ul>
          </div>
          <p className="text-xs text-white/70">Free forever · No credit card</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-2 font-bold md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
              <Activity className="h-4 w-4" />
            </span>
            Formulate
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your training.</p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <SignIn appearance={appearance} fallbackRedirectUrl="/app" />
            </Suspense>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-green-500 hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
