"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFallbackOffer, setNeedsFallbackOffer] = useState(false);

  const [form, setForm] = useState({
    age: "22",
    sex: "male",
    heightCm: "169",
    weightKg: "62",
    estimatedBfPct: "25",
    trainingDaysPerWeek: "5",
    experienceLevel: "returning",
    equipmentAccess: "full_gym",
    injuryNotes: "Mild lower-back pain a few years ago from deadlift and squat form (no current pain).",
    dietaryPreferences: "Chicken, eggs, dairy (curd/dahi, milk), oats, rice, roti, dal, soya chunks",
    dietaryExclusions: "fish, seafood",
    goalSummary: "Reach 70kg+ muscular at 10-15% body fat",
  });

  async function submitPlan(useTemplateFallback = false) {
    setLoading(true);
    setError(null);
    setNeedsFallbackOffer(false);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(form.age),
          sex: form.sex,
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          estimatedBfPct: form.estimatedBfPct ? Number(form.estimatedBfPct) : undefined,
          trainingDaysPerWeek: Number(form.trainingDaysPerWeek),
          experienceLevel: form.experienceLevel,
          equipmentAccess: form.equipmentAccess,
          injuryNotes: form.injuryNotes || "None",
          dietaryPreferences: form.dietaryPreferences,
          dietaryExclusions: form.dietaryExclusions || "None",
          goalSummary: form.goalSummary,
          useTemplateFallback,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503 && data.configured === false) {
          setNeedsFallbackOffer(true);
          setError(data.message || "AI key is not configured.");
        } else {
          setError(data.error || "Failed to generate your plan.");
        }
        return;
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Network error while generating your plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-600 text-xs text-white">F</span>
          Formulate
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-green-500" />
            Build Your Personalized AI Plan
          </CardTitle>
          <CardDescription>
            Share your current condition, injuries, and food rules. Formulate generates your custom macros, daily meal plan, spine-safe workout split, and multi-month roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              submitPlan(false);
            }}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sex">Sex</Label>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input id="heightCm" type="number" required value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weightKg">Current Weight (kg)</Label>
                <Input id="weightKg" type="number" step="0.1" required value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bf">Est. Body Fat (%)</Label>
                <Input id="bf" type="number" step="0.5" placeholder="25" value={form.estimatedBfPct} onChange={(e) => setForm({ ...form, estimatedBfPct: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="days">Gym Days / Week</Label>
                <Input id="days" type="number" min={2} max={6} required value={form.trainingDaysPerWeek} onChange={(e) => setForm({ ...form, trainingDaysPerWeek: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exp">Training Background</Label>
                <select
                  id="exp"
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="beginner">Beginner (less than 1 year)</option>
                  <option value="returning">Returning / Inconsistent (muscle memory)</option>
                  <option value="intermediate">Intermediate (1-3+ years consistent)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="equip">Equipment Access</Label>
                <select
                  id="equip"
                  value={form.equipmentAccess}
                  onChange={(e) => setForm({ ...form, equipmentAccess: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                  <option value="full_gym">Full Commercial Gym</option>
                  <option value="dumbbells_only">Dumbbells + Bench Only</option>
                  <option value="home_bodyweight">Home / Bodyweight</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal">Your Target Goal</Label>
              <Input id="goal" required value={form.goalSummary} onChange={(e) => setForm({ ...form, goalSummary: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="injuries">Injuries or Joint Limitations</Label>
              <Input id="injuries" value={form.injuryNotes} onChange={(e) => setForm({ ...form, injuryNotes: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dietPrefs">Foods You Eat / Prefer</Label>
                <Input id="dietPrefs" value={form.dietaryPreferences} onChange={(e) => setForm({ ...form, dietaryPreferences: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exclusions">Foods to Exclude</Label>
                <Input id="exclusions" value={form.dietaryExclusions} onChange={(e) => setForm({ ...form, dietaryExclusions: e.target.value })} />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <p>{error}</p>
                {needsFallbackOffer && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => submitPlan(true)}
                    disabled={loading}
                  >
                    Generate with Built-in Scientific Engine Instead
                  </Button>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Formulating your plan & meals...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate My Full Plan & Meal Schedule
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
