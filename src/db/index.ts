import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const DATABASE_URL = process.env.DATABASE_URL;

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a free Neon Postgres database, copy its connection string, and paste it into .env.local"
    );
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql, { schema });
}

export { schema };
