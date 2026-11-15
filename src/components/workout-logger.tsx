"use client";

import { useState, useTransition } from "react";
import { Activity, CheckCircle2, Dumbbell, Goal, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logWorkoutSet } from "@/lib/actions";
import type { WorkoutDayExercise } from "@/lib/db-queries";
import { cn } from "@/lib/utils";

export function WorkoutLogger({
  dayNumber,
  workouts,
}: {
  dayNumber: number;
  workouts: WorkoutDayExercise[];
}) {
  const [pending, startTransition] = useTransition();
  const [setsLogged, setSetsLogged] = useState<Record<number, number>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const totalSets = workouts.reduce((acc, w) => acc + w.targetSets, 0);
  const totalWork = workouts.reduce(
    (acc, w) => acc + w.targetSets * Math.round((w.minReps + w.maxReps) / 2),
    0
  );
  const primary = workouts[0];

  return (
    <div className="space-y-5">
      {/* Hero: Today's Workout */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400/15 text-lime-300">
              <Dumbbell className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-lime-300">Today&apos;s Workout</p>
              <CardTitle className="text-2xl tracking-tight">
                {primary?.dayTitle ?? "Active Recovery"}
              </CardTitle>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {workouts.length > 0 ? "Stay in the RPE window." : "Active recovery — 8k–10k steps + 10 min mobility."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {workouts.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <PlanStat icon={Activity} label="Exercises" value={String(workouts.length)} />
              <PlanStat icon={Goal} label="Target Sets" value={String(totalSets)} />
              <PlanStat icon={Timer} label="Rep Volume" value={`${totalWork} reps`} />
            </div>
          )}

          {workouts.length > 0 && (
            <div className="space-y-1.5">
              {workouts.map((w, idx) => (
                <div
                  key={w.slotId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground/10 text-[11px] font-bold text-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{w.exercise?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.targetSets} sets × {w.minReps}–{w.maxReps} reps · RPE {w.targetRpe} · rest {w.restSeconds}s
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {w.targetSets} sets
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logging */}
      {lastSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> {lastSaved}
        </div>
      )}

      <div className="space-y-4">
        {workouts.map((w) => (
          <ExerciseCard
            key={w.slotId}
            dayNumber={dayNumber}
            workout={w}
            setsLogged={setsLogged[w.slotId] ?? 0}
            onLogged={(label) => {
              setSetsLogged((m) => ({ ...m, [w.slotId]: (m[w.slotId] ?? 0) + 1 }));
              setLastSaved(label);
            }}
            pending={pending}
            startTransition={startTransition}
          />
        ))}
      </div>
    </div>
  );
}

function PlanStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-lime-300" />
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseCard({
  dayNumber,
  workout,
  setsLogged,
  onLogged,
  pending,
  startTransition,
}: {
  dayNumber: number;
  workout: WorkoutDayExercise;
  setsLogged: number;
  onLogged: (label: string) => void;
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);

  const startTimer = (seconds: number) => {
    if (timerId) clearInterval(timerId);
    setTimer(seconds);
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(id);
          setTimerId(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setTimerId(id);
  };

  const save = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const rp = parseFloat(rpe);
    if (!w || !r || !rp || Number.isNaN(w) || Number.isNaN(r) || Number.isNaN(rp)) return;
    const setNumber = setsLogged + 1;
    startTransition(async () => {
      const res = await logWorkoutSet({
        sessionDate: new Date().toISOString().slice(0, 10),
        dayNumber,
        exerciseId: workout.exercise!.id,
        setNumber,
        weightKg: w,
        reps: r,
        rpe: rp,
      });
      if (res.ok) {
        onLogged(`${workout.exercise!.name} · set ${setNumber} · ${w} kg × ${r} @ RPE ${rp}`);
        setWeight("");
        setReps("");
        setRpe("");
      }
    });
  };

  const ex = workout.exercise;
  const advice = workout.advice;
  const setsDone = setsLogged >= workout.targetSets;
  const deload = advice.action === "deload";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{ex?.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {workout.targetSets} sets · {workout.minReps}–{workout.maxReps} reps · RPE {workout.targetRpe} · rest{" "}
            {workout.restSeconds}s
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            deload && "border-red-400/40 text-red-300",
            !deload && advice.action === "add_weight" && "border-emerald-400/40 text-emerald-300"
          )}
        >
          {deload ? "Deload" : advice.action === "add_weight" ? `Next: ${advice.nextWeightKg} kg` : advice.action === "add_reps" ? "Add reps" : "Work to top"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {advice.reason && (
          <p className="text-xs text-muted-foreground">{advice.reason}</p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">kg</span>
            <Input type="number" inputMode="decimal" placeholder="40" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-20" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">reps</span>
            <Input type="number" inputMode="numeric" placeholder="10" value={reps} onChange={(e) => setReps(e.target.value)} className="w-16" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">RPE</span>
            <Input type="number" inputMode="decimal" step="0.5" placeholder="8" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-16" />
          </div>
          <Button onClick={save} disabled={pending || setsDone} variant={setsDone ? "surface" : "primarySoft"} className={cn(setsDone && "opacity-60")}>
            {setsDone ? `Done (${workout.targetSets}/${workout.targetSets})` : `Log set ${setsLogged + 1}`}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <Timer className="h-4 w-4 text-muted-foreground" />
          {[60, 90, 120, 180].map((s) => (
            <Button key={s} size="sm" variant="outline" onClick={() => startTimer(s)}>
              {s}s
            </Button>
          ))}
          {timer > 0 && (
            <Badge className="text-base">{timer}s</Badge>
          )}
          {timerId && (
            <Button size="sm" variant="ghost" onClick={() => { clearInterval(timerId!); setTimerId(null); setTimer(0); }}>
              Stop
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
