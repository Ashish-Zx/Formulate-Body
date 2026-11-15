import { NextResponse } from "next/server";
import { z } from "zod";
import { isAiConfigured, NO_KEY_MESSAGE, generateObjectReliable } from "@/lib/ai";

const ParsedItemSchema = z.object({
  mealSlot: z.enum(["Breakfast", "Lunch", "Pre/Post-Workout", "Dinner", "Snack"]),
  foodName: z.string(),
  gramsOrPortion: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbsG: z.number(),
});

const ParsedMealSchema = z.object({
  items: z.array(ParsedItemSchema),
  error: z.string().optional(),
});


export async function POST(req: Request) {
  if (!isAiConfigured()) {
    return NextResponse.json({ configured: false, message: NO_KEY_MESSAGE }, { status: 503 });
  }

  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Send a 'text' field describing what you ate." }, { status: 400 });
  }

  try {
    const plan = await generateObjectReliable({
      schema: ParsedMealSchema,
      system: [
        "You are a nutrition logger. Parse the user's meal description into structured nutrition items.",
        "Use standard South Asian/Nepali densities: cooked white rice 130 kcal/100g, whole-wheat roti ~85-100 kcal each, thick dal ~115 kcal/100g, raw chicken breast 165 kcal & 31g protein/100g, whole egg 72 kcal & 6.3g protein, soya chunks 345 kcal & 52g protein/100g dry.",
        "STRICT RULE: Reject fish or seafood. If the meal contains fish, set error to a message explaining no-fish rule and return empty items.",
      ].join("\n"),
      prompt: text,
    });

    return NextResponse.json({ configured: true, ...plan });
  } catch (err) {
    return NextResponse.json(
      { configured: true, error: err instanceof Error ? (err.message || (err as { cause?: { message?: string } })?.cause?.message || "AI provider error") : "AI provider error" },
      { status: 500 }
    );
  }
}
