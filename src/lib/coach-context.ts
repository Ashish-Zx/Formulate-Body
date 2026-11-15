import type { AthleteProfile, AthletePhase } from "@/db/schema";
import type { WorkoutDayExercise } from "@/lib/db-queries";

export type CoachContext = {
  profile: AthleteProfile | null;
  workout: WorkoutDayExercise[];
  nutrition: { calories: number; proteinG: number; fatG: number; carbsG: number };
  phases: AthletePhase[];
};

function formatWorkout(workout: WorkoutDayExercise[]): string {
  if (workout.length === 0) return "Active recovery day (8k-10k steps + 10 min mobility).";
  return workout
    .map(
      (w, i) =>
        `${i + 1}. ${w.exercise?.name ?? "Exercise"} — ${w.targetSets} sets × ${w.minReps}-${w.maxReps} reps, RPE ${w.targetRpe}, rest ${w.restSeconds}s`
    )
    .join("\n");
}

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const p = ctx.profile;
  const lines: string[] = [
    "You are the Body D AI Coach — a precise, encouraging personal trainer and nutrition coach.",
    "You coach the athlete in real time, grounded strictly in the live data below. Never invent metrics.",
    "Style: concise, warm, actionable. Use short paragraphs and sometimes tiny lists. No fluff.",
    "OUTPUT RULES: Plain text ONLY. Never use Markdown, and never use asterisks, backticks, # hash signs, or any other formatting symbols. Write numbers and calorie/gram values plainly. For lists use simple single hyphens (-) on their own lines. No bold, no italics, no headings.",
    "",
    "— COACHING GUARDRAILS —",
    "• Spine-safe programming: NO floor deadlifts, NO unsupported barbell rows.",
    "• Nutrition is strictly NO-FISH (vegetarian-friendly, South Asian meal patterns).",
    "• Keep protein on target first, calories second.",
    "",
  ];

  if (p) {
    lines.push(
      "— ATHLETE PROFILE —",
      `Phase: ${p.currentPhase.replace(/_/g, " ")}`,
      `Goal: ${p.goalSummary ?? "not set"}`,
      `Age ${p.age} · ${p.heightCm}cm · starting ${p.startingWeightKg}kg · est. body fat ${p.estimatedBfPct ?? "?"}%`,
      `Daily targets: ${p.targetCalories} kcal · ${p.targetProteinG}g P · ${p.targetFatG}g F · ${p.targetCarbsG}g C`,
      p.injuryNotes ? `Injury notes: ${p.injuryNotes}` : "",
      p.dietaryExclusions ? `Dietary exclusions: ${p.dietaryExclusions}` : "",
      ""
    );
  }

  lines.push("— TODAY'S WORKOUT —", formatWorkout(ctx.workout), "");

  lines.push(
    "— TODAY'S INTAKE (logged so far) —",
    `${Math.round(ctx.nutrition.calories)} kcal · ${Math.round(ctx.nutrition.proteinG)}g P · ${Math.round(ctx.nutrition.fatG)}g F · ${Math.round(ctx.nutrition.carbsG)}g C`,
    "",
    "— MULTI-MONTH ROADMAP —"
  );
  if (ctx.phases.length === 0) {
    lines.push("(not generated yet)");
  } else {
    lines.push(
      ctx.phases
        .map(
          (ph) =>
            `${ph.phaseName} (${ph.durationWeeks} wks): ${ph.calories} kcal, ${ph.proteinG}g P, ${ph.fatG}g F, ${ph.carbsG}g C ${ph.isActive ? "[ACTIVE]" : ""}`
        )
        .join(" | ")
    );
  }

  lines.push(
    "",
    "Answer the athlete's question using the data above. If you need a number you don't have, say you don't have that logged yet and suggest the simplest way to get it."
  );

  return lines.filter((l) => l !== "").join("\n");
}
