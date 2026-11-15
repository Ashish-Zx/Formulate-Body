// 7-day EMA weight trend + phase-transition evaluator per plan section 5B.
import { PHASES, DEFAULT_PHASE } from "@/lib/constants";

export function exponentialMovingAverage(values: number[], alpha = 0.25): number | null {
  if (!values.length) return null;
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
  }
  return ema;
}

// Weekly rate of change over the trailing window, in kg/week.
export function weeklyRateOfChange(
  dates: string[],
  weights: number[],
  windowDays = 14
): number | null {
  if (dates.length < 2) return null;
  const end = dates[dates.length - 1];
  const startIso = new Date(end);
  startIso.setDate(startIso.getDate() - windowDays);
  const start = startIso.toISOString().slice(0, 10);

  let firstIdx = -1;
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] >= start) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx <= 0) firstIdx = 0;
  const spanDays = Math.max(1, dates.length - 1 - firstIdx);
  const delta = weights[weights.length - 1] - weights[firstIdx];
  const perWeek = (delta / spanDays) * 7;
  return Number(perWeek.toFixed(2));
}

export type PhaseAdvice = {
  phase: string;
  keepCalories: number;
  suggestion: string | null;
};

export function advisePhase(params: {
  currentPhase?: string;
  weights: number[];
  dates: string[];
}): PhaseAdvice {
  const phase = params.currentPhase ?? DEFAULT_PHASE;
  const cfg = PHASES[phase as keyof typeof PHASES];
  const rate = weeklyRateOfChange(params.dates, params.weights);

  if (phase === "PHASE_1_RECOMP_CUT") {
    if (rate !== null && rate > 0.65) {
      return {
        phase,
        keepCalories: cfg.calories + 140,
        suggestion: `Weight dropping ${rate} kg/wk (faster than target). Add +35g carbs (+140 kcal) to protect lean mass.`,
      };
    }
    if (rate !== null && rate < 0.15) {
      return {
        phase,
        keepCalories: cfg.calories - 120,
        suggestion: `Loss slower than 0.15 kg/wk. Reduce carbs by -30g (-120 kcal).`,
      };
    }
    return { phase, keepCalories: cfg.calories, suggestion: null };
  }

  if (phase === "PHASE_2_LEAN_BULK") {
    if (rate !== null && rate < 0.25) {
      return {
        phase,
        keepCalories: cfg.calories + 150,
        suggestion: `Bulk stalled (${rate} kg/wk). Add +150 kcal (+37g carbs).`,
      };
    }
    return { phase, keepCalories: cfg.calories, suggestion: null };
  }

  return { phase, keepCalories: cfg.calories, suggestion: null };
}

export function detectPhaseTransition(emaWeightKg: number): boolean {
  return emaWeightKg >= 57.5 && emaWeightKg <= 58.5;
}
