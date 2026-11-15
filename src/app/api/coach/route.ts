import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, isAiConfigured, NO_KEY_MESSAGE } from "@/lib/ai";
import { getUserId } from "@/lib/auth";
import { getCoachHistory, getProfile, getTodayNutrition, getTodaysWorkout, getUserPhases, saveCoachMessage } from "@/lib/db-queries";
import { buildCoachSystemPrompt } from "@/lib/coach-context";

function messageFromError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "AI provider error";
}

export const dynamic = "force-dynamic";

// Coach endpoint — grounded in live user data with persistent conversation memory.
export async function POST(req: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false, message: NO_KEY_MESSAGE }, { status: 503 });
  }

  const { message } = await req.json().catch(() => ({ message: "" }));
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Send a 'message' field." }, { status: 400 });
  }

  const userId = await getUserId();

  try {
    const [profile, workout, nutrition, phases, history] = await Promise.all([
      getProfile(userId),
      getTodaysWorkout(userId),
      getTodayNutrition(userId),
      getUserPhases(userId),
      getCoachHistory(userId),
    ]);

    const system = buildCoachSystemPrompt({
      profile,
      workout,
      nutrition: nutrition.totals,
      phases,
    });

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    // Inception (OpenAI-compatible) requires the system prompt as a top-level
    // option rather than a message in the array.
    const { text } = await generateText({ model: getModel(), system, messages });

    // Persist memory after a successful reply.
    await saveCoachMessage(userId, "user", message);
    await saveCoachMessage(userId, "assistant", text);

    return NextResponse.json({ reply: text });
  } catch (err) {
    return NextResponse.json({ error: messageFromError(err) }, { status: 500 });
  }
}
