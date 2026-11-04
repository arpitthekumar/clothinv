import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function checkSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Supabase URL or Key missing in .env.local");
    return;
  }

  const supabase = createClient(url, key);

  console.log("Checking live Supabase for 'user_sessions' table...");
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id")
    .limit(1);

  if (error) {
    console.log("RESULT: TABLE_MISSING_OR_ERROR");
    console.log("Error details:", error.message);
  } else {
    console.log("RESULT: TABLE_EXISTS");
    console.log("Table 'user_sessions' is present on live Supabase! Found rows count:", data.length);
  }
}

checkSupabase();
