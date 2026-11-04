import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

async function runSetup() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Supabase URL or Key missing");
    return;
  }

  const supabase = createClient(url, key);

  // Check if user_sessions can be queried
  const { error } = await supabase.from("user_sessions").select("id").limit(1);

  if (error && error.message.includes("Could not find the table")) {
    console.log("Table 'user_sessions' does not exist yet in live Supabase.");
    console.log("Please run the SQL snippet in your Supabase SQL Editor:");
    console.log(`
--------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_api_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  pos_status TEXT DEFAULT 'ONLINE',
  current_pos_operation TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
--------------------------------------------------
`);
  } else {
    console.log("Table 'user_sessions' already exists and is ready in live Supabase!");
  }
}

runSetup();
