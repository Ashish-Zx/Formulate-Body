import { and, eq, desc, asc } from "drizzle-orm";
import { tryGetDb } from "@/db/safe";
import {
  athletePhases,
  athleteProfile,
  bodyMetrics,
  coachMessages,
  exercises,
  mealPresets,
  nutritionLogs,
  programmeSlots,
  workoutDayCompletions,
  workoutSets,
} from "@/db/schema";
import { todayIso, isoToDayNumber } from "@/lib/date";
import { recommendNextLoad, type ProgressionAdvice } from "@/lib/progression-engine";

export async function getProfile(userId: string) {
  const db = tryGetDb();
  if (!db) return null;
  const rows = await db.select().from(athleteProfile).where(eq(athleteProfile.userId, userId));
  return rows[0] ?? null;
}

export type NutritionTotals = { calories: number; proteinG: number; fatG: number; carbsG: number };

export async function getTodayNutrition(userId: string): Promise<{
  totals: NutritionTotals;
  items: (typeof nutritionLogs.$inferSelect)[];
}> {
  const db = tryGetDb();
  const zero: NutritionTotals = { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
  if (!db) return { totals: zero, items: [] };
  const items: (typeof nutritionLogs.$inferSelect)[] = await db
    .select()
    .from(nutritionLogs)
    .where(and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.logDate, todayIso())));
  const totals = items.reduce<NutritionTotals>(
    (acc, i) => {
      acc.calories += i.calories;
      acc.proteinG += i.proteinG;
      acc.fatG += i.fatG;
      acc.carbsG += i.carbsG;
      return acc;
    },
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );
  return { totals, items };
}

export async function getWeightSeries(userId: string): Promise<{ logDate: string; weightKg: number }[]> {
  const db = tryGetDb();
  if (!db) return [];
  return db
    .select({ weightKg: bodyMetrics.weightKg, logDate: bodyMetrics.logDate })
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(asc(bodyMetrics.logDate));
}

export async function getLatestWeight(userId: string) {
  const db = tryGetDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.logDate))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserStreak(userId: string): Promise<number> {
  const db = tryGetDb();
  if (!db) return 0;

  const [metricsDates, mealDates, setDates] = await Promise.all([
    db.select({ d: bodyMetrics.logDate }).from(bodyMetrics).where(eq(bodyMetrics.userId, userId)),
    db.select({ d: nutritionLogs.logDate }).from(nutritionLogs).where(eq(nutritionLogs.userId, userId)),
    db.select({ d: workoutSets.sessionDate }).from(workoutSets).where(eq(workoutSets.userId, userId)),
  ]);

  const activeSet = new Set<string>([
    ...metricsDates.map((r) => r.d),
    ...mealDates.map((r) => r.d),
    ...setDates.map((r) => r.d),
  ]);

  if (activeSet.size === 0) return 0;

  const today = new Date(`${todayIso()}T00:00:00Z`);
  let streak = 0;

  // Count consecutive days backwards from today (or yesterday if today isn't logged yet)
  for (let offset = 0; offset < 365; offset++) {
    const dt = new Date(today);
    dt.setUTCDate(dt.getUTCDate() - offset);
    const iso = dt.toISOString().slice(0, 10);
    if (activeSet.has(iso)) {
      streak++;
    } else if (offset === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export async function getUserPhases(userId: string) {
  const db = tryGetDb();
  if (!db) return [];
  return db
    .select()
    .from(athletePhases)
    .where(eq(athletePhases.userId, userId))
    .orderBy(asc(athletePhases.phaseOrder));
}

export async function getUserMealPresets(userId: string) {
  const db = tryGetDb();
  if (!db) return [];
  return db
    .select()
    .from(mealPresets)
    .where(eq(mealPresets.userId, userId))
    .orderBy(asc(mealPresets.orderIndex));
}

export type WorkoutDayExercise = {
  slotId: number;
  dayTitle: string;
  exercise: (typeof exercises.$inferSelect) | null;
  targetSets: number;
  minReps: number;
  maxReps: number;
  targetRpe: number;
  restSeconds: number;
  advice: ProgressionAdvice;
};

export async function getWorkoutForDay(
  userId: string,
  dayNumber: number
): Promise<WorkoutDayExercise[]> {
  const db = tryGetDb();
  if (!db) return [];

  let slots = await db
    .select()
    .from(programmeSlots)
    .where(and(eq(programmeSlots.userId, userId), eq(programmeSlots.dayNumber, dayNumber)))
    .orderBy(asc(programmeSlots.orderIndex));

  // Fallback to default seeded programme only if this user has no custom programme slots at all
  if (slots.length === 0) {
    const anyUserSlots = await db
      .select({ id: programmeSlots.id })
      .from(programmeSlots)
      .where(eq(programmeSlots.userId, userId))
      .limit(1);

    if (anyUserSlots.length === 0) {
      slots = await db
        .select()
        .from(programmeSlots)
        .where(and(eq(programmeSlots.userId, "default"), eq(programmeSlots.dayNumber, dayNumber)))
        .orderBy(asc(programmeSlots.orderIndex));
    }
  }

  const allSets: (typeof workoutSets.$inferSelect)[] = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.userId, userId));

  const result: WorkoutDayExercise[] = [];
  for (const slot of slots) {
    const ex = await db.select().from(exercises).where(eq(exercises.id, slot.exerciseId));
    const exercise = ex[0] ?? null;
    const history = allSets.filter((s) => s.exerciseId === slot.exerciseId);
    const advice = recommendNextLoad(history, slot, exercise!);
    result.push({
      slotId: slot.id,
      dayTitle: slot.dayTitle,
      exercise,
      targetSets: slot.targetSets,
      minReps: slot.minReps,
      maxReps: slot.maxReps,
      targetRpe: slot.targetRpe,
      restSeconds: slot.restSeconds,
      advice,
    });
  }
  return result;
}

export async function getTodaysWorkout(userId: string) {
  return getWorkoutForDay(userId, isoToDayNumber(todayIso()));
}

export type ProgrammeDayOverview = {
  dayNumber: number;
  dayTitle: string;
  phase: "past" | "today" | "future";
  scheduleDate: string;
  exercises: {
    slotId: number;
    name: string;
    targetSets: number;
    repRange: string;
    targetRpe: number;
    restSeconds: number;
    completed: boolean;
  }[];
};

/** ISO date for a given programme day (1=Monday … 7=Sunday) in the current week. */
export function scheduleForDayNumber(dayNumber: number): string {
  const ref = new Date(`${todayIso()}T00:00:00Z`);
  const wd = ref.getUTCDay(); // 0=Sun … 6=Sat
  const daysSinceMonday = wd === 0 ? 6 : wd - 1;
  const monday = new Date(ref);
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  monday.setUTCDate(monday.getUTCDate() + (dayNumber - 1));
  return monday.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Manual self-reported completions, keyed by ISO date. */
export async function getDayCompletions(userId: string): Promise<Record<string, boolean>> {
  const db = tryGetDb();
  if (!db) return {};
  const rows = await db
    .select({ logDate: workoutDayCompletions.logDate, completed: workoutDayCompletions.completed })
    .from(workoutDayCompletions)
    .where(eq(workoutDayCompletions.userId, userId));
  const map: Record<string, boolean> = {};
  for (const r of rows) if (r.completed) map[r.logDate] = true;
  return map;
}

/**
 * Week-wide programme overview ordered from TODAY forward (today → next 6
 * days), so a freshly generated plan reads as starting today. Each day's
 * `completed` is true if the user logged all target sets (auto) OR marked it
 * done manually.
 */
export async function getProgrammeOverview(userId: string): Promise<ProgrammeDayOverview[]> {
  const db = tryGetDb();
  if (!db) return [];

  let slots = await db
    .select()
    .from(programmeSlots)
    .where(eq(programmeSlots.userId, userId))
    .orderBy(asc(programmeSlots.dayNumber), asc(programmeSlots.orderIndex));

  // Fallback to default seeded programme if this user has none.
  if (slots.length === 0) {
    slots = await db
      .select()
      .from(programmeSlots)
      .where(eq(programmeSlots.userId, "default"))
      .orderBy(asc(programmeSlots.dayNumber), asc(programmeSlots.orderIndex));
  }

  const allSets = await db.select().from(workoutSets).where(eq(workoutSets.userId, userId));
  const setCountByExDate = new Map<string, number>();
  for (const s of allSets) {
    const key = `${s.exerciseId}:${s.sessionDate}`;
    setCountByExDate.set(key, (setCountByExDate.get(key) ?? 0) + 1);
  }

  const libRows = await db.select({ id: exercises.id, name: exercises.name }).from(exercises);
  const nameById = new Map<number, string>();
  for (const r of libRows) nameById.set(r.id, r.name);

  const completions = await getDayCompletions(userId);

  const today = todayIso();
  const todayDn = isoToDayNumber(today);

  const byDay = new Map<number, (typeof programmeSlots.$inferSelect)[]>();
  for (const s of slots) {
    if (!byDay.has(s.dayNumber)) byDay.set(s.dayNumber, []);
    byDay.get(s.dayNumber)!.push(s);
  }

  const days: ProgrammeDayOverview[] = [];
  for (let k = 0; k < 7; k++) {
    // Cycle day numbers starting from today's day-of-week.
    const dn = ((todayDn - 1 + k) % 7) + 1;
    const scheduleDate = addDays(today, k);
    const phase: ProgrammeDayOverview["phase"] = k === 0 ? "today" : "future";
    const slotList = byDay.get(dn) ?? [];

    const exerciseRows = slotList.map((slot) => {
      const logged = setCountByExDate.get(`${slot.exerciseId}:${scheduleDate}`) ?? 0;
      const autoCompleted = logged >= slot.targetSets;
      return {
        slotId: slot.id,
        name: nameById.get(slot.exerciseId) ?? `Exercise #${slot.exerciseId}`,
        targetSets: slot.targetSets,
        repRange: `${slot.minReps}-${slot.maxReps}`,
        targetRpe: slot.targetRpe,
        restSeconds: slot.restSeconds,
        completed: autoCompleted || completions[scheduleDate] === true,
      };
    });

    days.push({
      dayNumber: dn,
      dayTitle: slotList[0]?.dayTitle ?? "Active Recovery",
      phase,
      scheduleDate,
      exercises: exerciseRows,
    });
  }

  return days;
}

export type CoachMessage = Pick<(typeof coachMessages.$inferSelect), "role" | "content">;

/** Load the most recent coach conversation for a user, oldest first. */
export async function getCoachHistory(userId: string, limit = 30): Promise<CoachMessage[]> {
  const db = tryGetDb();
  if (!db) return [];
  const rows = await db
    .select({ role: coachMessages.role, content: coachMessages.content })
    .from(coachMessages)
    .where(eq(coachMessages.userId, userId))
    .orderBy(desc(coachMessages.id))
    .limit(limit);
  return rows.reverse();
}

/** Persist a single coach message. */
export async function saveCoachMessage(userId: string, role: "user" | "assistant", content: string) {
  const db = tryGetDb();
  if (!db) return;
  await db.insert(coachMessages).values({ userId, role, content });
}
