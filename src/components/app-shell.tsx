"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Utensils, Bot, LayoutDashboard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClerkControls } from "@/components/clerk-controls";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/coach", label: "Coach", icon: Bot },
];

const HAS_CLERK = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/app" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 text-sm font-black text-black shadow-[0_8px_24px_-8px_oklch(0.833_0.184_135/0.7)]">
              <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              Formulate
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {HAS_CLERK && (
              <Suspense fallback={null}>
                <ClerkControls />
              </Suspense>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Formulate
      </footer>
    </div>
  );
}
