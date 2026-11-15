// RPE double-progression engine per plan section 5A.
import type { Exercise, ProgrammeSlot, WorkoutSet } from "@/db/schema";

export const UPPER_COMPOUND_INCREMENT_KG = 2.5;
export const LOWER_COMPOUND_INCREMENT_KG = 5.0;

const ISOLATION_CATEGORIES = new Set([
  "chest_isolation",
  "hamstring_isolation",
  "delts",
  "arms",
  "calves",
  "quad_isolation",
  "core",
]);

export function isIsolation(category: string): boolean {
  return ISOLATION_CATEGORIES.has(category);
}

export type SessionGroup = {
  sessionDate: string;
  sets: WorkoutSet[];
};

export function groupBySession(sets: WorkoutSet[]): SessionGroup[] {
  const map = new Map<string, SessionGroup>();
  for (const s of sets) {
    const g = map.get(s.sessionDate);
    if (g) g.sets.push(s);
    else map.set(s.sessionDate, { sessionDate: s.sessionDate, sets: [s] });
  }
  return [...map.values()];
}

export type ProgressionAdvice = {
  action: "add_weight" | "add_reps" | "hold" | "deload";
  nextWeightKg: number | null;
  reason: string;
};

// Check whether every working set in a session hit the top of the rep range at/below target RPE.
function sessionHitTop(session: SessionGroup, slot: ProgrammeSlot): boolean {
  if (!session.sets.length) return false;
  return session.sets.every(
    (s) => s.reps >= slot.maxReps && s.rpe <= slot.targetRpe
  );
}

function compoundIncrement(exercise: Exercise): number {
  return exercise.progressionIncrementKg ?? UPPER_COMPOUND_INCREMENT_KG;
}

/**
 * Deterministic next-load recommendation for an exercise.
 * `history` must be the set logs for this exercise (any order; function groups by date).
 */
export function recommendNextLoad(
  history: WorkoutSet[],
  slot: ProgrammeSlot,
  exercise: Exercise
): ProgressionAdvice {
  const sessions = groupBySession(history)
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

  const last = sessions[sessions.length - 1];
  if (!last) {
    return { action: "hold", nextWeightKg: null, reason: "No logged sessions yet — Week 1 calibration: pick a load for RPE 7–8." };
  }

  // Deload guardrail: RPE > 9 or regressing reps across 2 straight sessions.
  const prev = sessions[sessions.length - 2];
  const rpeHigh = last.sets.some((s) => s.rpe > 9.0);
  const repsDropped = prev
    ? last.sets.reduce((a, s) => a + s.reps, 0) < prev.sets.reduce((a, s) => a + s.reps, 0)
    : false;
  if (rpeHigh && repsDropped) {
    return {
      action: "deload",
      nextWeightKg: last.sets[last.sets.length - 1].weightKg * 0.9,
      reason: "RPE above 9 with dropping reps — deload (60% sets, RPE 6).",
    };
  }

  const lastWeight = last.sets[last.sets.length - 1].weightKg;

  if (isIsolation(exercise.category)) {
    // Isolations add reps first; bump weight only once top of range is hit cleanly.
    const topHitLast = sessionHitTop(last, slot);
    const topHitPrev = prev ? sessionHitTop(prev, slot) : false;
    if (topHitLast && topHitPrev) {
      return {
        action: "add_weight",
        nextWeightKg: +(lastWeight + 1.25).toFixed(2),
        reason: `Hit ${slot.maxReps} reps at RPE ≤ ${slot.targetRpe} for 2 sessions — add 1.25 kg.`,
      };
    }
    if (topHitLast) {
      return {
        action: "add_reps",
        nextWeightKg: lastWeight,
        reason: `Isolation: hit ${slot.maxReps} reps — add 1–2 reps next session before adding weight.`,
      };
    }
    return {
      action: "hold",
      nextWeightKg: lastWeight,
      reason: `Work toward ${slot.maxReps} reps at RPE ≤ ${slot.targetRpe}.`,
    };
  }

  // Compounds: 2 consecutive clean sessions -> bump by compound increment.
  const topHitLast = sessionHitTop(last, slot);
  const topHitPrev = prev ? sessionHitTop(prev, slot) : false;
  if (topHitLast && topHitPrev) {
    const inc = compoundIncrement(exercise);
    return {
      action: "add_weight",
      nextWeightKg: +(lastWeight + inc).toFixed(2),
      reason: `Hit ${slot.maxReps} reps at RPE ≤ ${slot.targetRpe} for 2 consecutive sessions — add ${inc} kg.`,
    };
  }
  return {
    action: "hold",
    nextWeightKg: lastWeight,
    reason: `Work toward ${slot.maxReps} reps at RPE ≤ ${slot.targetRpe} across all sets.`,
  };
}

export function getDeloadSettings(slot: ProgrammeSlot, blockWeek: number): {
  sets: number;
  targetRpe: number;
  deload: boolean;
} {
  if (blockWeek >= 6) {
    return { sets: Math.ceil(slot.targetSets * 0.6), targetRpe: 6, deload: true };
  }
  return { sets: slot.targetSets, targetRpe: slot.targetRpe, deload: false };
}
