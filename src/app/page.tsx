import Link from "next/link";
import {
  Bot,
  Utensils,
  TrendingUp,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Coach",
    text: "A coach that reads your live training and nutrition data to answer, guide, and adjust your plan.",
  },
  {
    icon: Utensils,
    title: "Macro & nutrition logger",
    text: "1-tap South Asian/Nepali meal presets and natural-language food logging. No fish — ever.",
  },
  {
    icon: TrendingUp,
    title: "Progressive overload engine",
    text: "Auto-computed next target weights the moment you hit your rep range for two clean sessions.",
  },
  {
    icon: LineChart,
    title: "Weight trend & TDEE",
    text: "A 7-day rolling average smooths daily swings and tells you exactly when to cut, hold, or bulk.",
  },
];

const STEPS = [
  { n: "1", title: "Sign up & set your goal", text: "Create a free account and tell us where you are and where you want to go." },
  { n: "2", title: "Get your plan", text: "A personalized split and macro targets are generated for your physiology." },
  { n: "3", title: "Train, log, adjust", text: "Log workouts and meals; the engine and AI coach keep you on track." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
              F
            </span>
            Formulate
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <span className="rounded-full bg-green-600/15 px-3 py-1 text-xs font-semibold text-green-500">
            Free SaaS · No credit card
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your AI coach for a stronger, leaner you.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground sm:text-lg">
            Formulate turns your goals into a personalized plan — spine-safe programming,
            no-fish nutrition, and a live macro log. All free.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app">Explore the app</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free forever · Works on iOS, Android, and desktop
          </p>
        </section>

        {/* Features */}
        <section id="features" className="py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything you need to transform</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Built around real coaching methodology — not guesswork.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-6 w-6 text-green-500" />
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n}>
                <CardHeader>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Formulate · Free AI fitness & macro coach
      </footer>
    </div>
  );
}
