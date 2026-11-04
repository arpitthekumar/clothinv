import { Client } from "pg";

async function addCustomerId() {
  const client = new Client({
    user: "postgres",
    password: "wts@cloth@inv",
    host: "db.qplkfefmifxpdinberwo.supabase.co",
    port: 5432,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    console.log("Adding customer_id column to sales...");
    await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);");
    console.log("Column and index added.");

    console.log("Reloading PostgREST schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("PostgREST schema reload notified.");

    await client.end();
  } catch (err: any) {
    console.error("Error:", err.message);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

addCustomerId();

