import { NextResponse } from "next/server";

// Stub for bidirectional Markdown sync with coach-data/.
// Full implementation exports latest DB state to coach-data/*.md.
export async function GET() {
  return NextResponse.json({
    message: "Markdown sync endpoint ready. Full implementation ships with the AI coach milestone.",
  });
}
