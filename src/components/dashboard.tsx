"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CalendarRange,
  Check,
  Dumbbell,
  Flame,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Utensils,
  Weight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyDbBanner } from "@/components/empty-db-banner";
import { logNutrition, logWeighIn } from "@/lib/actions";
import { cn } from "@/lib/utils";

export type DashboardData = {
  hasDb: boolean;
  profile: {
    age: number;
    heightCm: number;
    startingWeightKg: number;
    estimatedBfPct: number | null;
    currentPhase: string;
    targetCalories: number;
    targetProteinG: number;
    targetFatG: number;
    targetCarbsG: number;
    goalSummary: string;
    timelineSummary: string | null;
  } | null;
  streak: number;
  totals: { calories: number; proteinG: number; fatG: number; carbsG: number };
  mealPresets: {
    id: number;
    mealSlot: string;
    foodName: string;
    portion: string;
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
  }[];
  weightSeries: { logDate: string; weightKg: number }[];
  latestWeight: number | null;
  todayWorkoutTitle: string | null;
  todayWorkout: {
    name: string;
    sets: number;
    repRange: string;
    targetRpe: number;
    note: string | null;
  }[];
  phases: {
    id: number;
    phaseOrder: number;
    phaseName: string;
    durationWeeks: number;
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    rationale: string;
    isActive: boolean;
  }[];
  ema: number | null;
};

function pct(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [loggedMealIds, setLoggedMealIds] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  if (!data.hasDb || !data.profile) {
    return <EmptyDbBanner />;
  }

  const { profile, totals } = data;
  const chartData = data.weightSeries.map((p) => ({
    label: p.logDate.slice(5),
    weight: p.weightKg,
  }));

  const submitWeight = () => {
    const w = parseFloat(weight);
    if (!w || Number.isNaN(w)) return;
    const waistCm = waist ? parseFloat(waist) : undefined;
    startTransition(async () => {
      await logWeighIn({ weightKg: w, waistCm });
      setWeight("");
      setWaist("");
    });
  };

  const quickLogMeal = (meal: DashboardData["mealPresets"][number]) => {
    startTransition(async () => {
      await logNutrition({
        mealSlot: meal.mealSlot,
        foodName: meal.foodName,
        gramsOrPortion: meal.portion,
        calories: meal.calories,
        proteinG: meal.proteinG,
        fatG: meal.fatG,
        carbsG: meal.carbsG,
      });
      setLoggedMealIds((prev) => [...prev, meal.id]);
    });
  };

  return (
    <div className="space-y-5">
      {/* SECTION 1: Athlete overview hero */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gradient-to-r from-emerald-400/20 to-lime-400/20 text-emerald-300">
                <Target className="h-3.5 w-3.5" />
                {profile.currentPhase.replace(/_/g, " ")}
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                <Flame className="h-3.5 w-3.5" /> {data.streak} day streak
              </span>
            </div>
            <CardTitle className="mt-3 text-2xl tracking-tight">Overview</CardTitle>
            <CardDescription className="text-sm">{profile.goalSummary}</CardDescription>
          </div>
          <Button asChild size="sm" variant="surface">
            <Link href="/onboarding">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Update Condition
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Weight} label="Body Weight" value={`${data.latestWeight ?? profile.startingWeightKg} kg`} />
            <StatTile label="Height" value={`${profile.heightCm} cm`} />
            <StatTile label="Age" value={`${profile.age} yrs`} />
            <StatTile icon={Trophy} label="Consistency" value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`} />
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Morning Weight (kg)</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder={String(data.latestWeight ?? 62)}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Waist (cm, opt)</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="84"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-28"
              />
            </div>
            <Button onClick={submitWeight} disabled={pending} variant="primarySoft">
              <Plus className="h-4 w-4" /> Log Weigh-In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Today's Daily Diet Plan & Macro Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                <Utensils className="h-4 w-4" />
              </span>
              Today&apos;s Daily Diet Plan
            </CardTitle>
            <CardDescription>
              Target: {profile.targetCalories} kcal · {profile.targetProteinG}g P · {profile.targetFatG}g F · {profile.targetCarbsG}g C
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="surface">
            <Link href="/nutrition">Full Nutrition Log</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <MacroRow label="Protein" current={totals.proteinG} target={profile.targetProteinG} unit="g" />
            <MacroRow label="Calories" current={totals.calories} target={profile.targetCalories} unit="kcal" />
            <MacroRow label="Carbs" current={totals.carbsG} target={profile.targetCarbsG} unit="g" />
            <MacroRow label="Fat" current={totals.fatG} target={profile.targetFatG} unit="g" />
          </div>

          {data.mealPresets.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.mealPresets.map((meal) => {
                const isLogged = loggedMealIds.includes(meal.id);
                return (
                  <div
                    key={meal.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-3",
                      isLogged ? "border-emerald-400/40 bg-emerald-400/5" : "border-border/70 bg-muted/20"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                          {meal.mealSlot}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {meal.calories} kcal · {meal.proteinG}g P
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">{meal.foodName}</p>
                      <p className="text-xs text-muted-foreground">{meal.portion}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isLogged ? "surface" : "primarySoft"}
                      disabled={pending}
                      onClick={() => quickLogMeal(meal)}
                    >
                      {isLogged ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Logged
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Log
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No meal presets found yet. Click Update Condition to generate your personalized meal plan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: Today's Workout Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400/15 text-lime-300">
                <Dumbbell className="h-4 w-4" />
              </span>
              Today&apos;s Workout Plan
              {data.todayWorkoutTitle ? ` — ${data.todayWorkoutTitle}` : ""}
            </CardTitle>
            <CardDescription>Log sets &amp; track rest</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/workout">Start Workout</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.todayWorkout.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.todayWorkout.map((ex, idx) => (
                <li
                  key={`${ex.name}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ex.name}</p>
                    {ex.note && <p className="truncate text-xs text-muted-foreground">{ex.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">
                      {ex.sets} × {ex.repRange}
                    </Badge>
                    <Badge variant="secondary">RPE {ex.targetRpe}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Active recovery — 8k–10k steps + 10 min mobility.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Multi-Month Roadmap & Weight Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
              <CalendarRange className="h-4 w-4" />
            </span>
            Your Multi-Month Roadmap
          </CardTitle>
          {profile.timelineSummary && <CardDescription>{profile.timelineSummary}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-5">
          {data.phases.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {data.phases.map((phase) => (
                <div
                  key={phase.id}
                  className={cn(
                    "rounded-xl border p-3.5",
                    phase.isActive
                      ? "border-emerald-400/50 bg-gradient-to-b from-emerald-400/10 to-transparent"
                      : "border-border/70 bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{phase.phaseName}</p>
                    <Badge variant={phase.isActive ? "default" : "outline"}>
                      {phase.durationWeeks} wks
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {phase.calories} kcal · {phase.proteinG}g P · {phase.fatG}g F · {phase.carbsG}g C
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{phase.rationale}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Body Weight Trend</span>
              {data.ema !== null && (
                <span className="text-xs text-muted-foreground">
                  7-day EMA: <span className="font-semibold text-foreground">{data.ema.toFixed(1)} kg</span>
                </span>
              )}
            </div>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="transparent" />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="transparent" />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--chart-1)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Log at least 2 morning weigh-ins to plot your rolling trend line.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function MacroRow({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const value = pct(current, target);
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <Progress value={value} className="mt-2" />
    </div>
  );
}
