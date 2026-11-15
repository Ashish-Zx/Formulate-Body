"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { tryGetDb } from "@/db/safe";
import { bodyMetrics, nutritionLogs, workoutDayCompletions, workoutSets } from "@/db/schema";
import { getUserId } from "@/lib/auth";
import { todayIso } from "@/lib/date";

const WeighInSchema = z.object({
  weightKg: z.number().min(30).max(160),
  waistCm: z.number().min(40).max(150).optional(),
  stepsCount: z.number().int().min(0).optional(),
});

const WorkoutSetSchema = z.object({
  sessionDate: z.string(),
  dayNumber: z.number().int().min(1).max(7),
  exerciseId: z.number().int(),
  setNumber: z.number().int().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(1),
  rpe: z.number().min(4).max(10),
});

const NutritionSchema = z.object({
  mealSlot: z.string().min(1),
  foodName: z.string().min(1),
  gramsOrPortion: z.string().default("1 portion"),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  fatG: z.number().min(0),
  carbsG: z.number().min(0),
});

export async function logWeighIn(input: z.infer<typeof WeighInSchema>) {
  const db = tryGetDb();
  if (!db) return { ok: false, error: "Configure DATABASE_URL first." };
  const parsed = WeighInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid weigh-in values." };

  const userId = await getUserId();
  await db
    .insert(bodyMetrics)
    .values({
      userId,
      logDate: todayIso(),
      weightKg: parsed.data.weightKg,
      waistCm: parsed.data.waistCm ?? null,
      stepsCount: parsed.data.stepsCount ?? null,
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.logDate],
      set: {
        weightKg: parsed.data.weightKg,
        waistCm: parsed.data.waistCm ?? null,
        stepsCount: parsed.data.stepsCount ?? null,
      },
    });
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true };
}

export async function logWorkoutSet(input: z.infer<typeof WorkoutSetSchema>) {
  const db = tryGetDb();
  if (!db) return { ok: false, error: "Configure DATABASE_URL first." };
  const parsed = WorkoutSetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid set values." };

  const userId = await getUserId();
  await db.insert(workoutSets).values({ userId, ...parsed.data });
  revalidatePath("/workout");
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true };
}

const WorkoutCompletionSchema = z.object({
  logDate: z.string().min(1),
  completed: z.boolean(),
});

export async function setWorkoutCompletion(input: z.infer<typeof WorkoutCompletionSchema>) {
  const db = tryGetDb();
  if (!db) return { ok: false, error: "Configure DATABASE_URL first." };
  const parsed = WorkoutCompletionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid completion values." };

  const userId = await getUserId();
  await db
    .insert(workoutDayCompletions)
    .values({ userId, logDate: parsed.data.logDate, completed: parsed.data.completed })
    .onConflictDoUpdate({
      target: [workoutDayCompletions.userId, workoutDayCompletions.logDate],
      set: { completed: parsed.data.completed },
    });
  revalidatePath("/workout");
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true };
}

export async function logNutrition(input: z.infer<typeof NutritionSchema>) {
  const db = tryGetDb();
  if (!db) return { ok: false, error: "Configure DATABASE_URL first." };
  const parsed = NutritionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid nutrition values." };

  const userId = await getUserId();
  await db.insert(nutritionLogs).values({
    userId,
    logDate: todayIso(),
    ...parsed.data,
  });
  revalidatePath("/nutrition");
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNutrition(id: number) {
  const db = tryGetDb();
  if (!db) return { ok: false, error: "Configure DATABASE_URL first." };
  const userId = await getUserId();
  await db
    .delete(nutritionLogs)
    .where(and(eq(nutritionLogs.id, id), eq(nutritionLogs.userId, userId)));
  revalidatePath("/nutrition");
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true };
}
