import { getDb } from "./index";

export type Db = ReturnType<typeof getDb>;

// Returns the DB handle when DATABASE_URL is configured, otherwise null.
export function tryGetDb(): Db | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    return getDb();
  } catch {
    return null;
  }
}
