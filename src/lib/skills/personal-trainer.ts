import { z } from "zod";

export const ConditionInputSchema = z.object({
  age: z.coerce.number().int().min(14).max(90),
  sex: z.enum(["male", "female"]),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(30).max(220),
  estimatedBfPct: z.coerce.number().min(5).max(60).optional(),
  trainingDaysPerWeek: z.coerce.number().int().min(2).max(6),
  experienceLevel: z.enum(["beginner", "intermediate", "returning"]),
  equipmentAccess: z.enum(["full_gym", "dumbbells_only", "home_bodyweight"]),
  injuryNotes: z.string().max(400).default("None"),
  dietaryPreferences: z.string().max(400).default("High-protein, practical whole foods"),
  dietaryExclusions: z.string().max(300).default("None"),
  goalSummary: z.string().min(4).max(300),
});

export type ConditionInput = z.infer<typeof ConditionInputSchema>;

export const GeneratedPlanSchema = z.object({
  timelineSummary: z
    .string()
    .describe("Honest, evidence-based 2-3 sentence overview of how long the full transformation will take and what the next 3-4 months will accomplish."),
  phases: z
    .array(
      z.object({
        phaseName: z.string().describe("Short phase title, e.g. 'Phase 1: Recomp / Lean Cut'"),
        durationWeeks: z.number().int().min(2).max(52),
        calories: z.number().int().min(1200).max(5000),
        proteinG: z.number().int().min(60).max(350),
        fatG: z.number().int().min(30).max(200),
        carbsG: z.number().int().min(40).max(700),
        rationale: z.string().describe("1-2 sentences explaining the calorie target, rate of change, and when to transition."),
      })
    )
    .min(2)
    .max(4),
  weeklySplit: z
    .array(
      z.object({
        dayNumber: z.number().int().min(1).max(7).describe("ISO weekday 1=Mon .. 7=Sun"),
        dayTitle: z.string().describe("e.g. 'Upper A', 'Lower A', 'Push', 'Full Body A'"),
        exercises: z
          .array(
            z.object({
              name: z.string(),
              category: z.string().describe("horizontal_push | incline_push | vertical_push | vertical_pull | horizontal_pull | quad_compound | hip_hinge | hamstring_isolation | unilateral_leg | delts | arms | core | calves"),
              isCompound: z.boolean(),
              isUpperBody: z.boolean(),
              sets: z.number().int().min(2).max(6),
              minReps: z.number().int().min(4).max(20),
              maxReps: z.number().int().min(6).max(25),
              targetRpe: z.number().min(6).max(9.5),
              restSeconds: z.number().int().min(45).max(240),
              injuryNote: z.string().describe("Brief form or safety cue tailored to the user's injuryNotes"),
            })
          )
          .min(4)
          .max(8),
      })
    )
    .min(2)
    .max(6),
  dailyMealPlan: z
    .array(
      z.object({
        mealSlot: z.string().describe("e.g. 'Meal 1: Breakfast', 'Meal 2: Lunch', 'Meal 3: Pre/Post-Workout', 'Meal 4: Dinner'"),
        foodName: z.string().describe("Practical whole-food meal matching user dietaryPreferences and strictly excluding dietaryExclusions"),
        portion: z.string().describe("Exact gram/serving quantities"),
        calories: z.number().int().min(100).max(1800),
        proteinG: z.number().min(5).max(120),
        fatG: z.number().min(1).max(80),
        carbsG: z.number().min(5).max(220),
      })
    )
    .min(3)
    .max(6),
});

export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

export const PERSONAL_TRAINER_SYSTEM_PROMPT = `
You are Coach — an evidence-based scientific personal trainer and nutritionist.
Ground every number and recommendation in strength-and-conditioning and nutrition science:
1. TDEE & Macros: Estimate BMR via Mifflin-St Jeor and multiply by activity factor (1.45-1.65 for 3-6x/week lifting).
   - Fat loss / Recomp: 300-500 kcal deficit (0.3-0.5% bodyweight/week).
   - Lean bulk: 250-350 kcal surplus (+0.25-0.35 kg/week).
   - Protein: 1.6-2.2 g/kg bodyweight (non-negotiable). Fat: >= 0.7 g/kg. Carbs fill the remaining calories.
2. Training & Injury Safety:
   - Use RPE-based loading (RPE 7-8 for hypertrophy compounds, 8-9 for isolations).
   - Respect EVERY injury/limitation strictly (e.g. if lower-back history is noted, exclude conventional floor deadlifts and unsupported bent-over barbell rows; use chest-supported rows, leg press/hack squats, and controlled RDLs at RPE 7-8).
   - Match equipmentAccess (full_gym vs dumbbells_only vs home_bodyweight) and trainingDaysPerWeek.
   - Use ISO dayNumber 1..7 spaced with rest days so muscles recover.
3. Nutrition & Exclusions:
   - Strictly honour EVERY dietary exclusion (never include excluded foods like fish, dairy, meat, etc.).
   - Make meals practical, whole-food, and culturally realistic for the user's preferences, and ensure the sum of dailyMealPlan calories and macros closely matches Phase 1 targets.
4. Honesty: Be realistic about timelines (e.g. 3-4 months for a solid cut/recomp block, 12-18 months for major lean mass gain).
`.trim();
