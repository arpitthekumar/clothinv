import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

async function verify() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
    process.exit(1);
  }

  console.log(`\n🔍 Verifying Supabase project: ${url}\n`);
  const supabase = createClient(url, key);

  let allPassed = true;

  // 1. Check user_sessions
  const { error: errSessions } = await supabase.from("user_sessions").select("id, user_id, session_token").limit(1);
  if (errSessions) {
    console.error(`❌ Table "user_sessions" missing or inaccessible:`, errSessions.message);
    allPassed = false;
  } else {
    console.log(`✅ Table "user_sessions" is READY`);
  }

  // 2. Check salespersons
  const { error: errSalespersons } = await supabase.from("salespersons").select("id, name, active").limit(1);
  if (errSalespersons) {
    console.error(`❌ Table "salespersons" missing or inaccessible:`, errSalespersons.message);
    allPassed = false;
  } else {
    console.log(`✅ Table "salespersons" is READY`);
  }

  // 3. Check store_settings
  const { data: storeData, error: errStore } = await supabase.from("store_settings").select("id, store_name, subscription_expiry_date").limit(1);
  if (errStore) {
    console.error(`❌ Table "store_settings" missing or inaccessible:`, errStore.message);
    allPassed = false;
  } else {
    console.log(`✅ Table "store_settings" is READY (Rows found: ${storeData?.length || 0})`);
  }

  // 4. Check backup_logs
  const { error: errBackup } = await supabase.from("backup_logs").select("id, status, trigger").limit(1);
  if (errBackup) {
    console.error(`❌ Table "backup_logs" missing or inaccessible:`, errBackup.message);
    allPassed = false;
  } else {
    console.log(`✅ Table "backup_logs" is READY`);
  }

  // 5. Check products columns
  const { error: errProducts } = await supabase.from("products").select("id, category_id, min_stock, is_bargainable, min_price").limit(1);
  if (errProducts) {
    console.error(`❌ Products table missing new columns (is_bargainable, min_price):`, errProducts.message);
    allPassed = false;
  } else {
    console.log(`✅ Products columns (is_bargainable, min_price) are READY`);
  }

  // 6. Check customers columns
  const { error: errCustomers } = await supabase.from("customers").select("id, name, deleted").limit(1);
  if (errCustomers) {
    console.error(`❌ Customers table missing or column 'deleted' missing:`, errCustomers.message);
    allPassed = false;
  } else {
    console.log(`✅ Customers table columns are READY`);
  }

  // 7. Check sales columns
  const { error: errSales } = await supabase.from("sales").select("id, customer_id, salesperson_id, salesperson_name").limit(1);
  if (errSales) {
    console.error(`❌ Sales table missing salesperson columns:`, errSales.message);
    allPassed = false;
  } else {
    console.log(`✅ Sales columns (customer_id, salesperson_id, salesperson_name) are READY`);
  }

  console.log("\n--------------------------------------------------");
  if (allPassed) {
    console.log("🎉 SUCCESS: All database schema updates verified! The application is fully compatible.");
    process.exit(0);
  } else {
    console.error("⚠️  Some tables or columns are not yet applied. Please run MIGRATION_UPDATE.sql in your Supabase SQL Editor.");
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});

