// Single-user default. When Clerk auth is enabled, pages swap this for the signed-in Clerk userId.
export const DEFAULT_USER_ID = "local-user";

export const PHASES = {
  PHASE_1_RECOMP_CUT: {
    label: "Phase 1 — Recomp / Lean Cut",
    calories: 2000,
    proteinG: 140,
    fatG: 55,
    carbsG: 236,
    ph: -0.35, // kg/week target
  },
  MAINTENANCE: {
    label: "Maintenance Bridge",
    calories: 2300,
    proteinG: 145,
    fatG: 60,
    carbsG: 250,
    phase: 0,
  },
  PHASE_2_LEAN_BULK: {
    label: "Phase 2 — Controlled Lean Bulk",
    calories: 2600,
    proteinG: 150,
    fatG: 68,
    carbsG: 347,
    phase: 0.3,
  },
} as const;

export const DEFAULT_PHASE = "PHASE_1_RECOMP_CUT";
