import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  sqlClient = postgres(url, { max: 10, prepare: true, idle_timeout: 20 });
  dbInstance = drizzle(sqlClient);
  return dbInstance;
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);


