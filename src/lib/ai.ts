import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import type { ZodType } from "zod";

const GW_BASE = process.env.NEON_AI_GATEWAY_BASE_URL;
const GW_TOKEN = process.env.NEON_AI_GATEWAY_TOKEN;
const GW_MODEL = process.env.NEON_AI_GATEWAY_MODEL;

const INCEPTION_BASE = process.env.INCEPTION_BASE_URL || "https://api.inceptionlabs.ai/v1";
const INCEPTION_TOKEN = process.env.INCEPTION_API_KEY;
const INCEPTION_MODEL = process.env.INCEPTION_MODEL || "mercury-3";

export function hasInceptionKey(): boolean {
  return Boolean(INCEPTION_TOKEN);
}

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function hasNeonAIGateway(): boolean {
  return Boolean(GW_BASE && GW_TOKEN && GW_MODEL);
}

export function isAiConfigured(): boolean {
  return hasInceptionKey() || hasGroqKey() || hasGeminiKey() || hasNeonAIGateway();
}

export function getModel(): LanguageModel {
  // Inception (diffusion LLM) via OpenAI-compatible endpoint — primary model.
  // Use `.chat()` to force the /chat/completions endpoint (Inception does not
  // implement the Responses API that createOpenAI otherwise defaults to).
  if (hasInceptionKey()) {
    const inception = createOpenAI({
      baseURL: INCEPTION_BASE,
      apiKey: INCEPTION_TOKEN,
      name: "inception",
    });
    return inception.chat(INCEPTION_MODEL) as LanguageModel;
  }

  // Groq support via OpenAI-compatible endpoint
  if (hasGroqKey()) {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    return groq(model) as LanguageModel;
  }

  // Direct Gemini key (gemini-3.5-flash-lite is active and reliable)
  if (hasGeminiKey()) {
    const provider = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    return provider(model) as LanguageModel;
  }

  // Neon AI Gateway
  const openai = createOpenAI({
    baseURL: `${GW_BASE!.replace(/\/$/, "")}/v1`,
    apiKey: GW_TOKEN,
  });
  return openai(GW_MODEL!) as LanguageModel;
}

export const NO_KEY_MESSAGE =
  "AI features are not configured. Add an INCEPTION_API_KEY, GROQ_API_KEY (console.groq.com), or GEMINI_API_KEY (aistudio.google.com).";

/**
 * The OpenAI-compatible providers (Inception, Groq, Neon AI Gateway) reject the
 * AI SDK's strict structured-output `response_format` for complex/optional
 * schemas and return 400 errors such as "Failed to validate JSON". These
 * providers accept plain JSON mode instead. Gemini natively supports structured
 * output.
 */
export function structuredOutputUsesJsonMode(): boolean {
  if (hasInceptionKey()) return true;
  if (hasGroqKey()) return true;
  if (hasGeminiKey()) return false;
  return true; // Neon AI Gateway
}

/**
 * Generate a structured object, retrying when the provider returns unparseable
 * or schema-invalid output. For OpenAI-compatible providers this forces JSON
 * mode (which they support) and raises the output-token cap, since Groq's
 * generation occasionally truncates or produces out-of-bounds values.
 */
export async function generateObjectReliable<T>(opts: {
  schema: ZodType<T>;
  system: string;
  prompt: string;
  maxAttempts?: number;
}): Promise<T> {
  const model = getModel();
  const jsonMode = structuredOutputUsesJsonMode();
  const maxAttempts = opts.maxAttempts ?? 4;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await generateObject({
        model,
        schema: opts.schema,
        system: opts.system,
        prompt: opts.prompt,
        ...(jsonMode ? { mode: "json" as const, maxOutputTokens: 16000 } : {}),
      });
      return result.object;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastErr;
}

