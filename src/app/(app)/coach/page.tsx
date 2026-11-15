import { connection } from "next/server";
import { CoachChat } from "@/components/coach-chat";
import { getCoachHistory } from "@/lib/db-queries";
import { isAiConfigured } from "@/lib/ai";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  await connection();
  const userId = await requireUser();
  const configured = isAiConfigured();
  const history = configured ? await getCoachHistory(userId) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI <span className="text-gradient">Coach</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remembers your conversation &amp; live data.
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="panel-glass rounded-2xl border p-6 text-sm text-muted-foreground">
          Add an <span className="font-medium text-foreground">INCEPTION_API_KEY</span> to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> to enable the AI coach.
          <pre className="mt-3 rounded-lg bg-muted p-3 text-xs">{`INCEPTION_API_KEY=...`}</pre>
        </div>
      ) : (
        <CoachChat initialMessages={history.map((h) => ({ role: h.role, content: h.content }))} />
      )}
    </div>
  );
}
