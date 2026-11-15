import { pgTable, serial, text, integer, real, timestamp, boolean, date, index, uniqueIndex } from "drizzle-orm/pg-core";

// 1. Athlete Profile & Active Phase Targets
export const athleteProfile = pgTable("athlete_profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  onboarded: boolean("onboarded").default(false).notNull(),
  age: integer("age").default(22).notNull(),
  sex: text("sex").default("male").notNull(),
  heightCm: real("height_cm").default(169).notNull(),
  startingWeightKg: real("starting_weight_kg").default(62).notNull(),
  estimatedBfPct: real("estimated_bf_pct").default(25),
  currentPhase: text("current_phase").default("PHASE_1_RECOMP_CUT").notNull(),
  targetCalories: integer("target_calories").default(2000).notNull(),
  targetProteinG: integer("target_protein_g").default(140).notNull(),
  targetFatG: integer("target_fat_g").default(55).notNull(),
  targetCarbsG: integer("target_carbs_g").default(236).notNull(),
  dietaryExclusions: text("dietary_exclusions").default("fish,seafood").notNull(),
  injuryNotes: text("injury_notes")
    .default("History of mild lower back pain; avoid floor deadlifts and unsupported barbell rows.")
    .notNull(),
  goalSummary: text("goal_summary").default("Reach 70kg+ at 10-15% body fat").notNull(),
  timelineSummary: text("timeline_summary"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Daily Body Metrics
export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    logDate: date("log_date").notNull(),
    weightKg: real("weight_kg").notNull(),
    rolling7DayAvgKg: real("rolling_7d_avg_kg"),
    waistCm: real("waist_cm"),
    estimatedBfPct: real("estimated_bf_pct"),
    stepsCount: integer("steps_count").default(8000),
    sleepHours: real("sleep_hours"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("body_metrics_user_date_uidx").on(t.userId, t.logDate)]
);

// 3. Exercise Library
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  status: text("status").default("YES").notNull(),
  isCompound: boolean("is_compound").default(true).notNull(),
  isUpperBody: boolean("is_upper_body").default(true).notNull(),
  progressionIncrementKg: real("progression_increment_kg").default(2.5).notNull(),
  coachingNotes: text("coaching_notes"),
});

// 4. Programme Template (scoped per userId, or "default" for seed)
export const programmeSlots = pgTable(
  "programme_slots",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").default("default").notNull(),
    dayNumber: integer("day_number").notNull(),
    dayTitle: text("day_title").notNull(),
    orderIndex: integer("order_index").notNull(),
    exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
    targetSets: integer("target_sets").notNull(),
    minReps: integer("min_reps").notNull(),
    maxReps: integer("max_reps").notNull(),
    targetRpe: real("target_rpe").default(8.0).notNull(),
    restSeconds: integer("rest_seconds").default(120).notNull(),
  },
  (t) => [index("programme_slots_user_day_idx").on(t.userId, t.dayNumber)]
);

// 5. Multi-Phase Roadmap (3-4+ Month Transformation Plan per user)
export const athletePhases = pgTable(
  "athlete_phases",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    phaseOrder: integer("phase_order").notNull(),
    phaseName: text("phase_name").notNull(),
    durationWeeks: integer("duration_weeks").notNull(),
    calories: integer("calories").notNull(),
    proteinG: integer("protein_g").notNull(),
    fatG: integer("fat_g").notNull(),
    carbsG: integer("carbs_g").notNull(),
    rationale: text("rationale").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("athlete_phases_user_idx").on(t.userId)]
);

// 6. Personalized Daily Meal Plan Presets (per user)
export const mealPresets = pgTable(
  "meal_presets",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    orderIndex: integer("order_index").notNull(),
    mealSlot: text("meal_slot").notNull(),
    foodName: text("food_name").notNull(),
    portion: text("portion").notNull(),
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").notNull(),
    fatG: real("fat_g").notNull(),
    carbsG: real("carbs_g").notNull(),
  },
  (t) => [index("meal_presets_user_idx").on(t.userId)]
);

// 7. Workout Set Logs
export const workoutSets = pgTable(
  "workout_sets",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    sessionDate: date("session_date").notNull(),
    blockWeek: integer("block_week").default(1).notNull(),
    dayNumber: integer("day_number").notNull(),
    exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
    setNumber: integer("set_number").notNull(),
    weightKg: real("weight_kg").notNull(),
    reps: integer("reps").notNull(),
    rpe: real("rpe").notNull(),
    hitTopOfRange: boolean("hit_top_of_range").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("workout_sets_exercise_idx").on(t.exerciseId, t.sessionDate)]
);

// 8. Nutrition Logs
export const nutritionLogs = pgTable(
  "nutrition_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    logDate: date("log_date").notNull(),
    mealSlot: text("meal_slot").notNull(),
    foodName: text("food_name").notNull(),
    gramsOrPortion: text("grams_or_portion").notNull(),
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").notNull(),
    fatG: real("fat_g").notNull(),
    carbsG: real("carbs_g").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("nutrition_logs_user_date_idx").on(t.userId, t.logDate)]
);

// 8b. Manual workout-day completion (self-reported "did it" toggle)
export const workoutDayCompletions = pgTable(
  "workout_day_completions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    logDate: date("log_date").notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("workout_day_completions_user_date_uidx").on(t.userId, t.logDate)]
);

// 9. Coach conversation memory
export const coachMessages = pgTable(
  "coach_messages",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("coach_messages_user_idx").on(t.userId)]
);

export type AthleteProfile = typeof athleteProfile.$inferSelect;
export type BodyMetric = typeof bodyMetrics.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type ProgrammeSlot = typeof programmeSlots.$inferSelect;
export type AthletePhase = typeof athletePhases.$inferSelect;
export type MealPreset = typeof mealPresets.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
