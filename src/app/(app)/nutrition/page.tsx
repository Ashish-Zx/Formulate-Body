import { connection } from "next/server";
import { NutritionLogger } from "@/components/nutrition-logger";
import { getTodayNutrition } from "@/lib/db-queries";
import { requireUser } from "@/lib/auth";
import { tryGetDb } from "@/db/safe";
import { MEAL_PRESETS } from "@/lib/meal-presets";
import { EmptyDbBanner } from "@/components/empty-db-banner";

export default async function NutritionPage() {
  await connection();
  const userId = await requireUser();
  const hasDb = Boolean(tryGetDb());
  const today = await getTodayNutrition(userId);

  if (!hasDb) return <EmptyDbBanner />;

  return (
    <NutritionLogger
      presets={MEAL_PRESETS}
      initialItems={today.items}
      initialTotals={today.totals}
    />
  );
}

