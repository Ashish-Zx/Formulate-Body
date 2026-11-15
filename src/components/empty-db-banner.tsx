import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyDbBanner() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 py-6 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Database className="h-4 w-4 text-green-500" />
          Database not connected yet
        </div>
        <p className="text-muted-foreground">
          Create a free <span className="font-medium text-foreground">Neon Postgres</span> database,
          copy its connection string, and add it to <code className="rounded bg-muted px-1">.env.local</code>{" "}
          as <code className="rounded bg-muted px-1">DATABASE_URL</code>. Then run:
        </p>
        <pre className="w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs">
          {`npm run db:push\nnpm run db:seed`}
        </pre>
      </CardContent>
    </Card>
  );
}
