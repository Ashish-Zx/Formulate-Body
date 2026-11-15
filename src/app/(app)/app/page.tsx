import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { tryGetDb } from "@/db/safe";
import {
  getProfile,
  getTodayNutrition,
  getWeightSeries,
  getLatestWeight,
  getTodaysWorkout,
  getUserStreak,
  getUserPhases,
  getUserMealPresets,
} from "@/lib/db-queries";
import { requireUser } from "@/lib/auth";
import { exponentialMovingAverage } from "@/lib/tdee-calibrator";

export default async function HomePage() {
  await connection();
  const userId = await requireUser();
  const db = tryGetDb();
  const hasDb = Boolean(db);

  if (!hasDb) {
    return (
      <Dashboard
        data={{
          hasDb: false,
          profile: null,
          streak: 0,
          totals: { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
          mealPresets: [],
          weightSeries: [],
          latestWeight: null,
          todayWorkoutTitle: null,
          todayWorkout: [],
          phases: [],
          ema: null,
        }}
      />
    );
  }

  const profile = await getProfile(userId);
  if (!profile || !profile.onboarded) {
    redirect("/onboarding");
  }

  const [today, weightSeries, latest, workout, streak, phases, mealPresets] = await Promise.all([
    getTodayNutrition(userId),
    getWeightSeries(userId),
    getLatestWeight(userId),
    getTodaysWorkout(userId),
    getUserStreak(userId),
    getUserPhases(userId),
    getUserMealPresets(userId),
  ]);

  const ema = exponentialMovingAverage(weightSeries.map((w) => w.weightKg));

  const data = {
    hasDb: true,
    profile: {
      age: profile.age,
      heightCm: profile.heightCm,
      startingWeightKg: profile.startingWeightKg,
      estimatedBfPct: profile.estimatedBfPct,
      currentPhase: profile.currentPhase,
      targetCalories: profile.targetCalories,
      targetProteinG: profile.targetProteinG,
      targetFatG: profile.targetFatG,
      targetCarbsG: profile.targetCarbsG,
      goalSummary: profile.goalSummary,
      timelineSummary: profile.timelineSummary,
    },
    streak,
    totals: today.totals,
    mealPresets: mealPresets.map((m) => ({
      id: m.id,
      mealSlot: m.mealSlot,
      foodName: m.foodName,
      portion: m.portion,
      calories: m.calories,
      proteinG: m.proteinG,
      fatG: m.fatG,
      carbsG: m.carbsG,
    })),
    weightSeries: weightSeries.map((w) => ({ logDate: w.logDate, weightKg: w.weightKg })),
    latestWeight: latest ? latest.weightKg : profile.startingWeightKg,
    todayWorkoutTitle: workout[0]?.dayTitle ?? null,
    todayWorkout: workout.map((w) => ({
      name: w.exercise?.name ?? "Exercise",
      sets: w.targetSets,
      repRange: `${w.minReps}-${w.maxReps}`,
      targetRpe: w.targetRpe,
      note: w.exercise?.coachingNotes ?? null,
    })),
    phases: phases.map((p) => ({
      id: p.id,
      phaseOrder: p.phaseOrder,
      phaseName: p.phaseName,
      durationWeeks: p.durationWeeks,
      calories: p.calories,
      proteinG: p.proteinG,
      fatG: p.fatG,
      carbsG: p.carbsG,
      rationale: p.rationale,
      isActive: p.isActive,
    })),
    ema,
  };

  return <Dashboard data={data} />;
}
