"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteNutrition, logNutrition } from "@/lib/actions";
import type { MealPreset } from "@/lib/meal-presets";
import type { NutritionLog } from "@/db/schema";
import { cn } from "@/lib/utils";

type Totals = { calories: number; proteinG: number; fatG: number; carbsG: number };

const TARGETS: Totals = { calories: 2000, proteinG: 140, fatG: 55, carbsG: 236 };
const SLOT_ORDER = ["Breakfast", "Lunch", "Pre/Post-Workout", "Dinner", "Snack"];

export function NutritionLogger({
  presets,
  initialItems,
  initialTotals,
}: {
  presets: MealPreset[];
  initialItems: NutritionLog[];
  initialTotals: Totals;
}) {
  const [items, setItems] = useState(initialItems);
  const [totals, setTotals] = useState(initialTotals);
  const [pending, startTransition] = useTransition();
  const [loggedSlotIds, setLoggedSlotIds] = useState<Set<string>>(new Set());
  const [m, setM] = useState({ mealSlot: "Snack", foodName: "", calories: "", proteinG: "", fatG: "", carbsG: "" });

  const grouped = SLOT_ORDER.map((slot) => ({
    slot,
    meals: presets.filter((p) => p.mealSlot === slot),
  })).filter((g) => g.meals.length > 0);

  const addPreset = (p: MealPreset) => {
    startTransition(async () => {
      const res = await logNutrition({
        mealSlot: p.mealSlot,
        foodName: p.foodName,
        gramsOrPortion: p.portion,
        calories: p.calories,
        proteinG: p.proteinG,
        fatG: p.fatG,
        carbsG: p.carbsG,
      });
      if (res.ok) {
        setItems((it) => [
          ...it,
          {
            id: -Date.now(),
            userId: "local-user",
            logDate: new Date().toISOString().slice(0, 10),
            mealSlot: p.mealSlot,
            foodName: p.foodName,
            gramsOrPortion: p.portion,
            calories: p.calories,
            proteinG: p.proteinG,
            fatG: p.fatG,
            carbsG: p.carbsG,
            createdAt: new Date(),
          } as NutritionLog,
        ]);
        setTotals((t) => ({
          calories: t.calories + p.calories,
          proteinG: t.proteinG + p.proteinG,
          fatG: t.fatG + p.fatG,
          carbsG: t.carbsG + p.carbsG,
        }));
        setLoggedSlotIds((s) => new Set(s).add(p.id));
      }
    });
  };

  const addManual = () => {
    const cal = parseFloat(m.calories);
    const p = parseFloat(m.proteinG || "0");
    const f = parseFloat(m.fatG || "0");
    const c = parseFloat(m.carbsG || "0");
    if (!m.foodName || Number.isNaN(cal) || Number.isNaN(p) || Number.isNaN(f) || Number.isNaN(c)) return;
    startTransition(async () => {
      const res = await logNutrition({
        mealSlot: m.mealSlot,
        foodName: m.foodName,
        gramsOrPortion: "manual",
        calories: cal,
        proteinG: p,
        fatG: f,
        carbsG: c,
      });
      if (res.ok) {
        setItems((it) => [
          ...it,
          {
            id: -Date.now(),
            userId: "local-user",
            logDate: new Date().toISOString().slice(0, 10),
            mealSlot: m.mealSlot,
            foodName: m.foodName,
            gramsOrPortion: "manual",
            calories: cal,
            proteinG: p,
            fatG: f,
            carbsG: c,
            createdAt: new Date(),
          } as NutritionLog,
        ]);
        setTotals((t) => ({ calories: t.calories + cal, proteinG: t.proteinG + p, fatG: t.fatG + f, carbsG: t.carbsG + c }));
        setM({ mealSlot: m.mealSlot, foodName: "", calories: "", proteinG: "", fatG: "", carbsG: "" });
      }
    });
  };

  const remove = (id: number) => {
    startTransition(async () => {
      const item = items.find((i) => i.id === id);
      await deleteNutrition(id);
      if (item) {
        setTotals((t) => ({
          calories: Math.max(0, t.calories - item.calories),
          proteinG: Math.max(0, t.proteinG - item.proteinG),
          fatG: Math.max(0, t.fatG - item.fatG),
          carbsG: Math.max(0, t.carbsG - item.carbsG),
        }));
      }
      setItems((it) => it.filter((i) => i.id !== id));
    });
  };

  return (
    <div className="space-y-5">
      {/* Hero: Today's Diet */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <Utensils className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-300">Diet of Today</p>
              <CardTitle className="text-2xl tracking-tight">Today&apos;s Intake</CardTitle>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Hit protein first, then calories.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <MacroRow label="Calories" cur={totals.calories} target={TARGETS.calories} unit="kcal" />
          <MacroRow label="Protein" cur={totals.proteinG} target={TARGETS.proteinG} unit="g" />
          <MacroRow label="Fat" cur={totals.fatG} target={TARGETS.fatG} unit="g" />
          <MacroRow label="Carbs" cur={totals.carbsG} target={TARGETS.carbsG} unit="g" />
        </CardContent>
      </Card>

      {/* Today's meal plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Your Daily Meal Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No meal presets yet — use Add Food below or update your condition to generate a plan.
            </p>
          )}
          {grouped.map((g) => (
            <div key={g.slot}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  {g.slot}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.meals.map((p) => {
                  const isLogged = loggedSlotIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border p-3",
                        isLogged ? "border-emerald-400/40 bg-emerald-400/5" : "border-border/70 bg-muted/20"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{p.foodName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.calories} kcal · {p.proteinG}p / {p.fatG}f / {p.carbsG}c
                        </p>
                        <p className="text-xs text-muted-foreground">{p.portion}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isLogged ? "surface" : "primarySoft"}
                        disabled={pending}
                        onClick={() => addPreset(p)}
                      >
                        {isLogged ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" /> Logged
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Manual add + logged items */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Food</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Meal</span>
                <select value={m.mealSlot} onChange={(e) => setM({ ...m, mealSlot: e.target.value })} className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm">
                  {SLOT_ORDER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-40 flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Food</span>
                <Input placeholder="e.g. 2 rotis + 100g dahi" value={m.foodName} onChange={(e) => setM({ ...m, foodName: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <MiniInput label="kcal" value={m.calories} onChange={(v) => setM({ ...m, calories: v })} placeholder="200" className="w-20" />
              <MiniInput label="P" value={m.proteinG} onChange={(v) => setM({ ...m, proteinG: v })} placeholder="0" className="w-16" />
              <MiniInput label="F" value={m.fatG} onChange={(v) => setM({ ...m, fatG: v })} placeholder="0" className="w-16" />
              <MiniInput label="C" value={m.carbsG} onChange={(v) => setM({ ...m, carbsG: v })} placeholder="0" className="w-16" />
              <Button onClick={addManual} disabled={pending} variant="primarySoft">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logged Today</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length ? (
              <ul className="divide-y divide-border/60">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{i.foodName}</span>
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {i.mealSlot}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {i.calories} kcal · {i.proteinG}p
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing logged yet today.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MacroRow({ label, cur, target, unit }: { label: string; cur: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((cur / target) * 100));
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(cur)} / {target} {unit}</span>
      </div>
      <Progress value={pct} className="mt-2" />
    </div>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input type="number" inputMode="decimal" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={className} />
    </div>
  );
}
