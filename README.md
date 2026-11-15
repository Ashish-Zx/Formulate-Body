# Body D — AI Fitness & Macro Coach (PWA)

Your 62 kg → 70 kg+ recomp / lean-bulk tracker. Spine-safe programming, no-fish South Asian nutrition, Gemini AI hooks, mobile-installable.

## Stack
- Next.js 16 (App Router, Server Actions) + Tailwind v4 + shadcn-style UI + Recharts
- Drizzle ORM → **Neon serverless Postgres**
- Clerk auth (optional — app runs single-user without it)
- Vercel AI SDK + **Gemini** (Google AI)

## Setup (3 steps)

### 1. Database (Neon)
1. Create a free DB at https://neon.tech → copy the **connection string**.
2. Save it in `.env.local`:
   ```bash
   DATABASE_URL=postgresql://...
   ```
3. Push the schema and seed your data (programme, exercise library, meal presets):
   ```bash
   npm run db:push
   npm run db:seed
   ```

### 2. (Optional) Clerk auth
Create an app at https://clerk.com and add in `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```
Without these, the app runs as a single local user.

### 3. AI coach keys (optional)
The coach uses the **Inception** API by default (diffusion LLM). Set at least one provider:
```bash
INCEPTION_API_KEY=...            # primary — https://inceptionlabs.ai
# GEMINI_API_KEY=AIza...         # fallback — https://aistudio.google.com
# GROQ_API_KEY=...               # fallback — https://console.groq.com
```
Enables `/api/coach` (with conversation memory) and `/api/ai-food-parse`.

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Create a **Neon** Postgres DB; note its connection string.
3. Import the repo into **Vercel**. Add these Environment Variables (from `.env.example`):
   - `DATABASE_URL` (required)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (if using auth)
   - `INCEPTION_API_KEY` (or Gemini/Groq) for the AI coach
   - `INCEPTION_BASE_URL`, `INCEPTION_MODEL` only if you override defaults
4. Run migrations/seed once against production:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Deploy. The app is a server-rendered Next.js PWA; no extra servers needed.

> Note: keep real secrets out of the repo — `.env.example` holds placeholders only.

## Structure
- `src/db/schema.ts` — 6 tables (profile, metrics, exercises, programme, sets, nutrition)
- `src/db/seed.ts` — seeds your exact 5-day split + no-fish meal presets
- `src/lib/progression-engine.ts` — RPE double-progression + deload rules
- `src/lib/tdee-calibrator.ts` — 7-day EMA weight trend + phase advice
- `src/lib/actions.ts` — server actions (log set / nutrition / weigh-in)
- `src/app/` — Dashboard, Workout, Nutrition, Coach + API routes

## Current status
- ✅ Milestone 1 (core): dashboard, workout logger, nutrition logger, DB, seed, engines
- 🚧 Next: full AI coach chat with DB tools, onboarding → auto plan generator, `coach-data/` Markdown sync
