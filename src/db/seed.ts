import { getDb } from "./index";
import { athleteProfile, exercises, programmeSlots } from "./schema";
import { DEFAULT_USER_ID, DEFAULT_PHASE } from "@/lib/constants";

type ExerciseSeed = {
  name: string;
  category: string;
  status: "YES" | "SUB" | "NO";
  isCompound: boolean;
  isUpperBody: boolean;
  incrementKg: number;
  notes?: string;
};

const EXERCISES: ExerciseSeed[] = [
  { name: "Flat Bench Press", category: "horizontal_push", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "Primary chest compound (RPE 7-8), controlled 2-sec lowering" },
  { name: "Incline Dumbbell Press", category: "incline_push", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "30° bench, upper chest priority, full stretch at bottom" },
  { name: "Cable Fly / Pec Deck", category: "chest_isolation", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Controlled stretch, 12-15 reps" },
  { name: "Seated Dumbbell Overhead Press", category: "vertical_push", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "Seated with back support protects lower back" },
  { name: "Lat Pulldown / Pull-Ups", category: "vertical_pull", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "Full stretch at top, drive elbows down" },
  { name: "Chest-Supported Row", category: "horizontal_pull", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "Replaces unsupported bent-over row to save lower back" },
  { name: "Seated Cable Row", category: "horizontal_pull", status: "YES", isCompound: true, isUpperBody: true, incrementKg: 2.5, notes: "Keep torso braced, neutral spine" },
  { name: "Hack Squat / 45° Leg Press", category: "quad_compound", status: "YES", isCompound: true, isUpperBody: false, incrementKg: 5, notes: "High quad stimulus with zero lower-back shear" },
  { name: "Barbell Squat", category: "quad_compound", status: "SUB", isCompound: true, isUpperBody: false, incrementKg: 5, notes: "Optional only with strict bracing at RPE 7" },
  { name: "Conventional Deadlift", category: "hip_hinge", status: "NO", isCompound: true, isUpperBody: false, incrementKg: 5, notes: "Excluded due to past lower-back tweak" },
  { name: "Romanian Deadlift (RDL)", category: "hip_hinge", status: "YES", isCompound: true, isUpperBody: false, incrementKg: 5, notes: "Stop mid-shin; strict RPE 7-8 hinge" },
  { name: "Leg Curl", category: "hamstring_isolation", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 1.25, notes: "Seated/lying; 1-sec pause at contraction" },
  { name: "Bulgarian Split Squat", category: "unilateral_leg", status: "YES", isCompound: true, isUpperBody: false, incrementKg: 2.5, notes: "Upright torso, deep knee bend" },
  { name: "Dumbbell Lateral Raise", category: "delts", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Lead with elbows, 12-15 reps" },
  { name: "Cable Lateral Raise", category: "delts", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Constant tension on side delts" },
  { name: "Rope Face Pull", category: "delts", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Pull toward forehead, rear delts" },
  { name: "Rear Delt Machine Fly", category: "delts", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Finisher, 12-15 reps" },
  { name: "Incline Dumbbell Curl", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Full bicep stretch" },
  { name: "EZ-Bar Curl", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Squeeze at peak" },
  { name: "Dumbbell Hammer Curl", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Brachialis & forearm thickness" },
  { name: "Rope Pushdown", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Lock out smoothly" },
  { name: "Overhead Cable Triceps Extension", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 1.25, notes: "Targets long head of triceps" },
  { name: "Dip Machine", category: "arms", status: "YES", isCompound: false, isUpperBody: true, incrementKg: 2.5, notes: "Smooth lockout" },
  { name: "Hanging Knee / Leg Raise", category: "core", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 0, notes: "Builds anterior core stiffness" },
  { name: "Cable Crunch", category: "core", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 0, notes: "Brace abs hard" },
  { name: "Dead Bug + Plank", category: "core", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 0, notes: "Press lower back into floor" },
  { name: "Standing Calf Raise", category: "calves", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 1.25, notes: "2-sec pause at bottom stretch" },
  { name: "Seated Calf Raise", category: "calves", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 1.25, notes: "Full stretch" },
  { name: "Goblet Squat", category: "quad_compound", status: "YES", isCompound: true, isUpperBody: false, incrementKg: 2.5, notes: "Depth + upright posture" },
  { name: "Leg Extension", category: "quad_isolation", status: "YES", isCompound: false, isUpperBody: false, incrementKg: 1.25, notes: "Control eccentric" },
  { name: "High-Bar / Controlled Squat", category: "quad_compound", status: "SUB", isCompound: true, isUpperBody: false, incrementKg: 2.5, notes: "Spine-safe alternative to barbell squat" },
];

type SlotSeed = {
  dayNumber: number;
  dayTitle: string;
  exercise: string;
  sets: number;
  minReps: number;
  maxReps: number;
  rpe: number;
  rest: number;
};

// From coach-data/programme.md — 5-day spine-safe split
const PROGRAMME: SlotSeed[] = [
  // Day 1 — Upper A
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Flat Bench Press", sets: 3, minReps: 6, maxReps: 8, rpe: 8, rest: 150 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Chest-Supported Row", sets: 3, minReps: 8, maxReps: 10, rpe: 8, rest: 120 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Incline Dumbbell Press", sets: 3, minReps: 8, maxReps: 10, rpe: 8, rest: 120 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Lat Pulldown / Pull-Ups", sets: 3, minReps: 10, maxReps: 12, rpe: 8, rest: 90 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Dumbbell Lateral Raise", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "Rope Pushdown", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 60 },
  { dayNumber: 1, dayTitle: "Upper A", exercise: "EZ-Bar Curl", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 60 },
  // Day 2 — Lower A
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Hack Squat / 45° Leg Press", sets: 4, minReps: 8, maxReps: 10, rpe: 8, rest: 150 },
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Romanian Deadlift (RDL)", sets: 3, minReps: 8, maxReps: 10, rpe: 7.5, rest: 120 },
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Bulgarian Split Squat", sets: 3, minReps: 10, maxReps: 12, rpe: 8, rest: 90 },
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Leg Curl", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 90 },
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Standing Calf Raise", sets: 4, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
  { dayNumber: 2, dayTitle: "Lower A", exercise: "Cable Crunch", sets: 3, minReps: 12, maxReps: 15, rpe: 8, rest: 60 },
  // Day 4 — Upper B
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Seated Dumbbell Overhead Press", sets: 3, minReps: 8, maxReps: 10, rpe: 8, rest: 120 },
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Lat Pulldown / Pull-Ups", sets: 3, minReps: 8, maxReps: 10, rpe: 8, rest: 120 },
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Cable Fly / Pec Deck", sets: 3, minReps: 10, maxReps: 12, rpe: 8, rest: 120 },
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Seated Cable Row", sets: 3, minReps: 10, maxReps: 12, rpe: 8, rest: 90 },
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Rope Face Pull", sets: 3, minReps: 15, maxReps: 20, rpe: 8.5, rest: 60 },
  { dayNumber: 4, dayTitle: "Upper B", exercise: "Hanging Knee / Leg Raise", sets: 3, minReps: 10, maxReps: 15, rpe: 8, rest: 60 },
  // Day 5 — Lower B
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Romanian Deadlift (RDL)", sets: 3, minReps: 8, maxReps: 10, rpe: 7.5, rest: 150 },
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Goblet Squat", sets: 3, minReps: 10, maxReps: 12, rpe: 7.5, rest: 120 },
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Leg Extension", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 90 },
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Leg Curl", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 90 },
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Seated Calf Raise", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
  { dayNumber: 5, dayTitle: "Lower B", exercise: "Dead Bug + Plank", sets: 3, minReps: 10, maxReps: 15, rpe: 8, rest: 60 },
  // Day 6 — Arms & Delts
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Cable Lateral Raise", sets: 4, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Incline Dumbbell Curl", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 75 },
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Overhead Cable Triceps Extension", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 75 },
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Dumbbell Hammer Curl", sets: 3, minReps: 10, maxReps: 12, rpe: 8.5, rest: 60 },
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Dip Machine", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
  { dayNumber: 6, dayTitle: "Arms & Delts", exercise: "Rear Delt Machine Fly", sets: 3, minReps: 12, maxReps: 15, rpe: 8.5, rest: 60 },
];

async function main() {
  const db = getDb();

  // Upsert athlete profile
  await db
    .insert(athleteProfile)
    .values({
      userId: DEFAULT_USER_ID,
      age: 22,
      heightCm: 169,
      currentPhase: DEFAULT_PHASE,
      dietaryExclusions: "fish,seafood",
      injuryNotes:
        "History of mild lower back pain; avoid floor deadlifts and unsupported barbell rows.",
    })
    .onConflictDoNothing();

  // Insert exercises
  const inserted = await db.insert(exercises).values(EXERCISES).onConflictDoNothing().returning();
  const idByName = new Map<string, number>();
  for (const ex of inserted) idByName.set(ex.name, ex.id);

  // If any exercise already existed, fetch missing ids
  const missing = EXERCISES.filter((e) => !idByName.has(e.name));
  if (missing.length) {
    const existing = await db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises);
    for (const row of existing) idByName.set(row.name, row.id);
  }

  // Insert programme slots
  const slots = PROGRAMME.map((s) => ({
    dayNumber: s.dayNumber,
    dayTitle: s.dayTitle,
    orderIndex: PROGRAMME.filter((x) => x.dayNumber === s.dayNumber).indexOf(s) + 1,
    exerciseId: idByName.get(s.exercise)!,
    targetSets: s.sets,
    minReps: s.minReps,
    maxReps: s.maxReps,
    targetRpe: s.rpe,
    restSeconds: s.rest,
  }));

  if (slots.some((s) => !s.exerciseId)) {
    throw new Error("Seed failed: an exercise referenced by the programme was not found");
  }

  await db.insert(programmeSlots).values(slots).onConflictDoNothing();

  const count = await db.select({ count: programmeSlots.id }).from(programmeSlots);
  console.log(
    `Seed complete: ${inserted.length} exercises, ${slots.length} programme slots, athlete profile ready.`
  );
  console.log(`Verify: DATABASE_URL=${process.env.DATABASE_URL ? "set" : "MISSING"}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
