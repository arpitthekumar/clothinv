import fs from "fs";
import path from "path";
import { Client } from "pg";

async function run() {
  console.log("🚀 Starting database migration...");

  // Connection settings extracted from project configuration
  const client = new Client({
    user: "postgres",
    password: "wts@cloth@inv",
    host: "db.qplkfefmifxpdinberwo.supabase.co",
    port: 5432,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Connected directly to PostgreSQL at db.qplkfefmifxpdinberwo.supabase.co");

    const sqlPath = path.join(__dirname, "..", "MIGRATION_UPDATE.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("⚡ Executing non-destructive MIGRATION_UPDATE.sql...");
    await client.query(sql);

    console.log("🎉 Migration SQL applied successfully!");
    await client.end();
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

run();

