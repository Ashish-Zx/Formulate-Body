import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { isAiConfigured, NO_KEY_MESSAGE, generateObjectReliable } from "@/lib/ai";
import { tryGetDb } from "@/db/safe";
import {
  athletePhases,
  athleteProfile,
  bodyMetrics,
  exercises,
  mealPresets,
  programmeSlots,
} from "@/db/schema";
import { todayIso } from "@/lib/date";
import {
  ConditionInputSchema,
  GeneratedPlanSchema,
  PERSONAL_TRAINER_SYSTEM_PROMPT,
  type ConditionInput,
  type GeneratedPlan,
} from "@/lib/skills/personal-trainer";

function buildDeterministicFallbackPlan(input: ConditionInput): GeneratedPlan {
  const bmr =
    input.sex === "male"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;
  const activity = input.trainingDaysPerWeek >= 5 ? 1.55 : 1.45;
  const tdee = Math.round(bmr * activity);
  const bf = input.estimatedBfPct ?? 20;
  const cutFirst = bf >= 18;
  const phase1Cals = cutFirst ? Math.max(1500, tdee - 300) : tdee + 250;
  const proteinG = Math.round(input.weightKg * 2.1);
  const fatG = Math.round(input.weightKg * 0.85);
  const carbsG = Math.max(80, Math.round((phase1Cals - proteinG * 4 - fatG * 9) / 4));

  return {
    timelineSummary: cutFirst
      ? `Starting at ${input.weightKg} kg (~${bf}% BF), expect 12-16 weeks to lean down to ~14-15% body fat while rebuilding strength, followed by a controlled lean bulk toward your target.`
      : `Starting at ${input.weightKg} kg, expect steady lean mass gain over 16-24 weeks at +0.25 to +0.35 kg/week with progressive overload.`,
    phases: [
      {
        phaseName: cutFirst ? "Phase 1: Recomp / Lean Cut" : "Phase 1: Lean Hypertrophy Base",
        durationWeeks: 14,
        calories: phase1Cals,
        proteinG,
        fatG,
        carbsG,
        rationale: cutFirst
          ? "Mild 300 kcal deficit preserves lean mass and supports strength rebound while trimming waist fat."
          : "Controlled surplus minimizes fat spillover while fueling progressive overload.",
      },
      {
        phaseName: "Phase 2: Controlled Lean Bulk",
        durationWeeks: 20,
        calories: tdee + 300,
        proteinG: proteinG + 10,
        fatG: fatG + 10,
        carbsG: carbsG + 95,
        rationale: "Sustained +300 kcal surplus targeting +1.0 to +1.5 kg/month once lean base is established.",
      },
    ],
    weeklySplit: [
      {
        dayNumber: 1,
        dayTitle: "Upper A (Strength & Thickness)",
        exercises: [
          { name: "Flat Bench Press", category: "horizontal_push", isCompound: true, isUpperBody: true, sets: 3, minReps: 6, maxReps: 8, targetRpe: 8, restSeconds: 150, injuryNote: "Controlled 2-sec eccentric, retract scapulae." },
          { name: "Chest-Supported Row", category: "horizontal_pull", isCompound: true, isUpperBody: true, sets: 3, minReps: 8, maxReps: 10, targetRpe: 8, restSeconds: 120, injuryNote: "Pad supports torso to protect lower back." },
          { name: "Incline Dumbbell Press", category: "incline_push", isCompound: true, isUpperBody: true, sets: 3, minReps: 8, maxReps: 10, targetRpe: 8, restSeconds: 120, injuryNote: "30-degree bench, full stretch." },
          { name: "Lat Pulldown / Pull-Ups", category: "vertical_pull", isCompound: true, isUpperBody: true, sets: 3, minReps: 10, maxReps: 12, targetRpe: 8, restSeconds: 90, injuryNote: "Drive elbows down, no torso swing." },
          { name: "Dumbbell Lateral Raise", category: "delts", isCompound: false, isUpperBody: true, sets: 3, minReps: 12, maxReps: 15, targetRpe: 8.5, restSeconds: 60, injuryNote: "Lead with elbows." },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Lower A (Quad Priority)",
        exercises: [
          { name: "Hack Squat / 45° Leg Press", category: "quad_compound", isCompound: true, isUpperBody: false, sets: 4, minReps: 8, maxReps: 10, targetRpe: 8, restSeconds: 150, injuryNote: "Keep lower back flat against pad." },
          { name: "Romanian Deadlift (RDL)", category: "hip_hinge", isCompound: true, isUpperBody: false, sets: 3, minReps: 8, maxReps: 10, targetRpe: 7.5, restSeconds: 120, injuryNote: "Stop mid-shin; strict hip hinge." },
          { name: "Bulgarian Split Squat", category: "unilateral_leg", isCompound: true, isUpperBody: false, sets: 3, minReps: 10, maxReps: 12, targetRpe: 8, restSeconds: 90, injuryNote: "Upright torso, controlled depth." },
          { name: "Leg Curl", category: "hamstring_isolation", isCompound: false, isUpperBody: false, sets: 3, minReps: 10, maxReps: 12, targetRpe: 8.5, restSeconds: 90, injuryNote: "1-sec squeeze at contraction." },
        ],
      },
      {
        dayNumber: 4,
        dayTitle: "Upper B (Hypertrophy & Width)",
        exercises: [
          { name: "Seated Dumbbell Overhead Press", category: "vertical_push", isCompound: true, isUpperBody: true, sets: 3, minReps: 8, maxReps: 10, targetRpe: 8, restSeconds: 120, injuryNote: "Back glued to bench pad." },
          { name: "Seated Cable Row", category: "horizontal_pull", isCompound: true, isUpperBody: true, sets: 3, minReps: 10, maxReps: 12, targetRpe: 8, restSeconds: 90, injuryNote: "Neutral spine, no momentum." },
          { name: "Cable Fly / Pec Deck", category: "chest_isolation", isCompound: false, isUpperBody: true, sets: 3, minReps: 10, maxReps: 12, targetRpe: 8.5, restSeconds: 90, injuryNote: "Controlled stretch." },
          { name: "Rope Face Pull", category: "delts", isCompound: false, isUpperBody: true, sets: 3, minReps: 15, maxReps: 20, targetRpe: 8.5, restSeconds: 60, injuryNote: "Pull toward forehead." },
        ],
      },
      {
        dayNumber: 5,
        dayTitle: "Lower B (Posterior & Core)",
        exercises: [
          { name: "Romanian Deadlift (RDL)", category: "hip_hinge", isCompound: true, isUpperBody: false, sets: 3, minReps: 8, maxReps: 10, targetRpe: 7.5, restSeconds: 150, injuryNote: "Brace core; never round lumbar." },
          { name: "Goblet Squat", category: "quad_compound", isCompound: true, isUpperBody: false, sets: 3, minReps: 10, maxReps: 12, targetRpe: 7.5, restSeconds: 120, injuryNote: "Upright posture and full depth." },
          { name: "Leg Extension", category: "quad_isolation", isCompound: false, isUpperBody: false, sets: 3, minReps: 12, maxReps: 15, targetRpe: 8.5, restSeconds: 90, injuryNote: "Control eccentric." },
          { name: "Dead Bug + Plank", category: "core", isCompound: false, isUpperBody: false, sets: 3, minReps: 10, maxReps: 15, targetRpe: 8, restSeconds: 60, injuryNote: "Press lower back into floor." },
        ],
      },
    ],
    dailyMealPlan: [
      { mealSlot: "Meal 1: Breakfast", foodName: "Whole Eggs + Egg Whites + Rolled Oats + Banana", portion: "3 whole eggs, 2 whites, 60g oats, 1 banana", calories: Math.round(phase1Cals * 0.28), proteinG: Math.round(proteinG * 0.24), fatG: Math.round(fatG * 0.34), carbsG: Math.round(carbsG * 0.27) },
      { mealSlot: "Meal 2: Lunch", foodName: "Chicken Breast + Cooked Rice + Thick Dal + Salad", portion: "150g chicken breast, 200g rice, 100g dal, 1 tsp oil", calories: Math.round(phase1Cals * 0.31), proteinG: Math.round(proteinG * 0.36), fatG: Math.round(fatG * 0.2), carbsG: Math.round(carbsG * 0.33) },
      { mealSlot: "Meal 3: Pre/Post-Workout", foodName: "Whey / Soya Chunks + Whole-Wheat Bread + Peanut Butter", portion: "1 scoop whey (or 50g soya), 2 slices bread, 15g PB", calories: Math.round(phase1Cals * 0.17), proteinG: Math.round(proteinG * 0.2), fatG: Math.round(fatG * 0.2), carbsG: Math.round(carbsG * 0.16) },
      { mealSlot: "Meal 4: Dinner", foodName: "Chicken / Soya Chunks + 2 Rotis + Green Sabzi + Dahi", portion: "120g chicken, 2 rotis, sabzi, 100g low-fat curd", calories: Math.round(phase1Cals * 0.24), proteinG: Math.round(proteinG * 0.2), fatG: Math.round(fatG * 0.26), carbsG: Math.round(carbsG * 0.24) },
    ],
  };
}

export async function POST(req: Request) {
  // Allow unauthenticated onboarding: use the signed-in userId if available,
  // otherwise fall back to the default single-user id so the plan is saved.
  const { getUserId } = await import("@/lib/auth");
  const userId = await getUserId();
  const db = tryGetDb();
  if (!db) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const useTemplateFallback = Boolean(rawBody?.useTemplateFallback);
  const parsedInput = ConditionInputSchema.safeParse(rawBody);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Please check your form inputs.", issues: parsedInput.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsedInput.data;
  let plan: GeneratedPlan;

  if (!isAiConfigured() && !useTemplateFallback) {
    return NextResponse.json({ configured: false, message: NO_KEY_MESSAGE }, { status: 503 });
  }

  if (useTemplateFallback || !isAiConfigured()) {
    plan = buildDeterministicFallbackPlan(input);
  } else {
    try {
      plan = await generateObjectReliable({
        schema: GeneratedPlanSchema,
        system: PERSONAL_TRAINER_SYSTEM_PROMPT,
        prompt: `Generate a complete personalized fitness & nutrition plan for this athlete:
- Age: ${input.age}, Sex: ${input.sex}, Height: ${input.heightCm} cm, Weight: ${input.weightKg} kg
- Estimated Body Fat: ${input.estimatedBfPct ? `${input.estimatedBfPct}%` : "Not provided"}
- Training Experience: ${input.experienceLevel}, Available Days/Week: ${input.trainingDaysPerWeek}
- Equipment Access: ${input.equipmentAccess}
- Injuries / Pain History: ${input.injuryNotes}
- Dietary Preferences: ${input.dietaryPreferences}
- Dietary Exclusions (STRICTLY AVOID): ${input.dietaryExclusions}
- Goal: ${input.goalSummary}

Strict numeric bounds: sets 2-6; min reps 4-20; max reps 6-25; RPE 6-9.5; rest 45-240s; per-meal calories 100-1800.`,
      });
    } catch (err) {
      console.error("[generate-plan] AI error:", err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message || (err as { cause?: { message?: string } })?.cause?.message || "AI provider error"
              : "AI provider error",
        },
        { status: 500 }
      );
    }
  }

  const activePhase = plan.phases[0];

  // 1. Upsert athleteProfile
  await db
    .insert(athleteProfile)
    .values({
      userId,
      onboarded: true,
      age: input.age,
      sex: input.sex,
      heightCm: input.heightCm,
      startingWeightKg: input.weightKg,
      estimatedBfPct: input.estimatedBfPct ?? null,
      currentPhase: activePhase.phaseName,
      targetCalories: activePhase.calories,
      targetProteinG: activePhase.proteinG,
      targetFatG: activePhase.fatG,
      targetCarbsG: activePhase.carbsG,
      dietaryExclusions: input.dietaryExclusions,
      injuryNotes: input.injuryNotes,
      goalSummary: input.goalSummary,
      timelineSummary: plan.timelineSummary,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: athleteProfile.userId,
      set: {
        onboarded: true,
        age: input.age,
        sex: input.sex,
        heightCm: input.heightCm,
        startingWeightKg: input.weightKg,
        estimatedBfPct: input.estimatedBfPct ?? null,
        currentPhase: activePhase.phaseName,
        targetCalories: activePhase.calories,
        targetProteinG: activePhase.proteinG,
        targetFatG: activePhase.fatG,
        targetCarbsG: activePhase.carbsG,
        dietaryExclusions: input.dietaryExclusions,
        injuryNotes: input.injuryNotes,
        goalSummary: input.goalSummary,
        timelineSummary: plan.timelineSummary,
        updatedAt: new Date(),
      },
    });

  // 2. Log initial body weight for today if not already logged
  await db
    .insert(bodyMetrics)
    .values({
      userId,
      logDate: todayIso(),
      weightKg: input.weightKg,
      estimatedBfPct: input.estimatedBfPct ?? null,
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.logDate],
      set: {
        weightKg: input.weightKg,
        estimatedBfPct: input.estimatedBfPct ?? null,
      },
    });

  // 3. Replace athletePhases for this user
  await db.delete(athletePhases).where(eq(athletePhases.userId, userId));
  await db.insert(athletePhases).values(
    plan.phases.map((p, idx) => ({
      userId,
      phaseOrder: idx + 1,
      phaseName: p.phaseName,
      durationWeeks: p.durationWeeks,
      calories: p.calories,
      proteinG: p.proteinG,
      fatG: p.fatG,
      carbsG: p.carbsG,
      rationale: p.rationale,
      isActive: idx === 0,
    }))
  );

  // 4. Replace mealPresets for this user
  await db.delete(mealPresets).where(eq(mealPresets.userId, userId));
  await db.insert(mealPresets).values(
    plan.dailyMealPlan.map((m, idx) => ({
      userId,
      orderIndex: idx + 1,
      mealSlot: m.mealSlot,
      foodName: m.foodName,
      portion: m.portion,
      calories: m.calories,
      proteinG: m.proteinG,
      fatG: m.fatG,
      carbsG: m.carbsG,
    }))
  );

  // 5. Upsert exercises & replace user-scoped programmeSlots
  const allExistingExercises = await db.select().from(exercises);
  const exerciseIdByName = new Map<string, number>();
  for (const row of allExistingExercises) {
    exerciseIdByName.set(row.name.toLowerCase(), row.id);
  }

  const slotRows: {
    userId: string;
    dayNumber: number;
    dayTitle: string;
    orderIndex: number;
    exerciseId: number;
    targetSets: number;
    minReps: number;
    maxReps: number;
    targetRpe: number;
    restSeconds: number;
  }[] = [];

  for (const day of plan.weeklySplit) {
    for (let i = 0; i < day.exercises.length; i++) {
      const ex = day.exercises[i];
      let exId = exerciseIdByName.get(ex.name.toLowerCase());
      if (!exId) {
        const inserted = await db
          .insert(exercises)
          .values({
            name: ex.name,
            category: ex.category,
            status: "YES",
            isCompound: ex.isCompound,
            isUpperBody: ex.isUpperBody,
            progressionIncrementKg: ex.isCompound ? (ex.isUpperBody ? 2.5 : 5.0) : 1.25,
            coachingNotes: ex.injuryNote,
          })
          .onConflictDoNothing()
          .returning({ id: exercises.id });
        if (inserted[0]) {
          exId = inserted[0].id;
        } else {
          const [refetched] = await db
            .select({ id: exercises.id })
            .from(exercises)
            .where(eq(exercises.name, ex.name));
          exId = refetched?.id;
        }
        if (exId) exerciseIdByName.set(ex.name.toLowerCase(), exId);
      }

      if (exId) {
        slotRows.push({
          userId,
          dayNumber: day.dayNumber,
          dayTitle: day.dayTitle,
          orderIndex: i + 1,
          exerciseId: exId,
          targetSets: ex.sets,
          minReps: ex.minReps,
          maxReps: ex.maxReps,
          targetRpe: ex.targetRpe,
          restSeconds: ex.restSeconds,
        });
      }
    }
  }

  await db.delete(programmeSlots).where(eq(programmeSlots.userId, userId));
  if (slotRows.length > 0) {
    await db.insert(programmeSlots).values(slotRows);
  }

  revalidatePath("/app");
  revalidatePath("/workout");
  revalidatePath("/nutrition");

  return NextResponse.json({ ok: true, plan });
}
