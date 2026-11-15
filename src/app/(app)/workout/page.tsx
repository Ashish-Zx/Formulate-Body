import { connection } from "next/server";
import { WorkoutView } from "@/components/workout-view";
import { getDayCompletions, getProgrammeOverview, getTodaysWorkout } from "@/lib/db-queries";
import { requireUser } from "@/lib/auth";
import { tryGetDb } from "@/db/safe";
import { isoToDayNumber, todayIso } from "@/lib/date";
import { EmptyDbBanner } from "@/components/empty-db-banner";

export default async function WorkoutPage() {
  await connection();
  const userId = await requireUser();
  const hasDb = Boolean(tryGetDb());

  if (!hasDb) return <EmptyDbBanner />;

  const [workouts, programme, dayCompletions] = await Promise.all([
    getTodaysWorkout(userId),
    getProgrammeOverview(userId),
    getDayCompletions(userId),
  ]);
  const dayNumber = isoToDayNumber(todayIso());

  return <WorkoutView dayNumber={dayNumber} todayWorkout={workouts} programme={programme} dayCompletions={dayCompletions} />;
}
