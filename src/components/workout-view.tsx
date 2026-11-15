"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkoutLogger } from "@/components/workout-logger";
import { setWorkoutCompletion } from "@/lib/actions";
import type { WorkoutDayExercise, ProgrammeDayOverview } from "@/lib/db-queries";

const WEEKDAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WorkoutView({
  dayNumber,
  todayWorkout,
  programme,
  dayCompletions,
}: {
  dayNumber: number;
  todayWorkout: WorkoutDayExercise[];
  programme: ProgrammeDayOverview[];
  dayCompletions: Record<string, boolean>;
}) {
  const [tab, setTab] = useState<"today" | "programme">("today");

  return (
    <div className="space-y-5">
      <div className="flex w-fit items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
        {(
          [
            { id: "today", label: "Today's Session", icon: Dumbbell },
            { id: "programme", label: "Programme", icon: CalendarDays },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
              tab === t.id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" ? (
        <WorkoutLogger dayNumber={dayNumber} workouts={todayWorkout} />
      ) : (
        <ProgrammeTimeline days={programme} dayCompletions={dayCompletions} />
      )}
    </div>
  );
}

function ProgrammeTimeline({
  days,
  dayCompletions,
}: {
  days: ProgrammeDayOverview[];
  dayCompletions: Record<string, boolean>;
}) {
  const [manual, setManual] = useState<Record<string, boolean>>(dayCompletions);
  const [pending, startTransition] = useTransition();

  const toggle = (scheduleDate: string, current: boolean) => {
    const next = !current;
    setManual((m) => ({ ...m, [scheduleDate]: next }));
    startTransition(async () => {
      await setWorkoutCompletion({ logDate: scheduleDate, completed: next });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Your Programme</h2>
        <p className="text-sm text-muted-foreground">Tick today when done.</p>
      </div>

      {days.map((day) => {
        const explicit = manual[day.scheduleDate];
        const dayDone = explicit !== undefined ? explicit : day.exercises.length > 0 && day.exercises.every((e) => e.completed);

        return (
          <div
            key={day.scheduleDate}
            className={cn(
              "panel-glass rounded-2xl border transition-colors",
              dayDone && "border-emerald-400/40"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
                    day.phase === "today"
                      ? "bg-gradient-to-br from-emerald-400 to-lime-400 text-black"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {day.dayNumber}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">
                    {WEEKDAYS[day.dayNumber]} · {formatDate(day.scheduleDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {day.dayTitle} {day.phase === "today" && "· Today"}
                  </p>
                </div>
              </div>

              {day.phase === "today" && (
                <button
                  onClick={() => toggle(day.scheduleDate, dayDone)}
                  disabled={pending}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    dayDone
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {dayDone ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Completed
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Mark done
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-2">
              {day.exercises.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  Active recovery — 8k–10k steps + 10 min mobility.
                </p>
              ) : (
                day.exercises.map((ex) => {
                  const exDone = explicit !== undefined ? explicit : ex.completed;
                  return (
                    <div
                      key={ex.slotId}
                      className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 hover:bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.targetSets} sets × {ex.repRange} · RPE {ex.targetRpe} · rest {ex.restSeconds}s
                        </p>
                      </div>
                      {exDone && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <Check className="h-3.5 w-3.5" /> Done
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
