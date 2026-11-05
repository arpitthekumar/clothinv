import { Client } from "pg";
import { getTableName, getTableColumns } from "drizzle-orm";
import * as schema from "../shared/schema";

async function main() {
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

    // Fetch all public tables and their columns from PostgreSQL
    const res = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    const dbTables: Record<string, string[]> = {};
    for (const row of res.rows) {
      if (!dbTables[row.table_name]) dbTables[row.table_name] = [];
      dbTables[row.table_name].push(row.column_name);
    }

    console.log("=== CHECKING DRIZZLE SCHEMA TABLES VS DATABASE ===");
    
    for (const [exportName, exportVal] of Object.entries(schema)) {
      try {
        const tableName = getTableName(exportVal as any);
        if (!tableName) continue;
        
        const colsObj = getTableColumns(exportVal as any);
        const colNames = Object.values(colsObj).map((c: any) => c.name);

        const dbCols = dbTables[tableName];
        if (!dbCols) {
          console.log(`⚠️ Table missing in DB: ${tableName} (${exportName})`);
          continue;
        }

        const missingInDb = colNames.filter(c => !dbCols.includes(c));
        if (missingInDb.length > 0) {
          console.log(`❌ Table '${tableName}' MISSING columns in DB:`, missingInDb);
        } else {
          console.log(`✅ Table '${tableName}' has all ${colNames.length} columns.`);
        }
      } catch (_) {
        // Not a table
      }
    }

    await client.end();
  } catch (err: any) {
    console.error("Error:", err.message);
    try { await client.end(); } catch (_) {}
  }
}

main();
