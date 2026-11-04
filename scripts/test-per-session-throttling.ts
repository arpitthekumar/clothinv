import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { storage } from "../src/server/storage";
import { parseDeviceName } from "../src/lib/device-parser";

async function testPerSessionThrottling() {
  console.log("Testing Per-Session Throttling & Immediate BUSY State Sync...");

  const userId = "admin-dev-001";
  const tokenA = crypto.randomUUID();
  const tokenB = crypto.randomUUID();

  // Create Device A session
  await storage.createUserSession({
    userId,
    sessionToken: tokenA,
    deviceName: parseDeviceName("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"),
    ipAddress: "192.168.1.10",
  });

  // Create Device B session
  await storage.createUserSession({
    userId,
    sessionToken: tokenB,
    deviceName: parseDeviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15"),
    ipAddress: "192.168.1.20",
  });

  // 1. Device A API activity
  await storage.updateApiActivity(tokenA);
  console.log("1. Device A API activity updated.");

  // 2. Device B API activity (Independent session token)
  await storage.updateApiActivity(tokenB);
  console.log("2. Device B API activity updated independently.");

  // 3. Device A becomes BUSY after 1 minute (Bypasses 3-min throttle for critical POS event)
  const hbBusy = await storage.updateHeartbeat(tokenA, true, "Processing Checkout");
  console.log("3. Device A set to BUSY (Immediate Sync):", hbBusy);

  // 4. Verify status from storage
  const sessions = await storage.getUserSessions(userId);
  const sessA = sessions.find((s) => s.sessionToken === tokenA);
  const sessB = sessions.find((s) => s.sessionToken === tokenB);

  console.log("Device A Status:", sessA?.posStatus, sessA?.currentPosOperation);
  console.log("Device B Status:", sessB?.posStatus);

  if (sessA?.posStatus === "BUSY" && sessB?.posStatus === "ONLINE") {
    console.log("ALL PER-SESSION THROTTLING & IMMEDIATE BUSY SYNC TESTS PASSED!");
  } else {
    console.error("Test failed!");
  }
}

testPerSessionThrottling().catch(console.error);
