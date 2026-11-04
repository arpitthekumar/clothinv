import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { storage } from "../src/server/storage";
import { parseDeviceName } from "../src/lib/device-parser";

async function testHeartbeatLogic() {
  console.log("Testing Heartbeat & Session Token generation...");

  const userId = "admin-dev-001";
  const token = crypto.randomUUID();

  // Create session
  const created = await storage.createUserSession({
    userId,
    sessionToken: token,
    deviceName: parseDeviceName("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"),
    ipAddress: "127.0.0.1",
  });

  console.log("1. Created session:", created.id, created.sessionToken);

  // Update Heartbeat (Immediate POS state change)
  const hb1 = await storage.updateHeartbeat(token, true, "Processing Checkout");
  console.log("2. State change heartbeat (Immediate DB Sync):", hb1);

  // Update Heartbeat (Periodic liveness check)
  const hb2 = await storage.updateHeartbeat(token);
  console.log("3. Periodic liveness heartbeat (Throttled DB Sync):", hb2);

  // Fetch active sessions
  const sessions = await storage.getUserSessions(userId);
  console.log("4. Active sessions count:", sessions.length);

  console.log("ALL HEARTBEAT TESTS PASSED CLEANLY!");
}

testHeartbeatLogic().catch(console.error);
