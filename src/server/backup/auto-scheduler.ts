import { createFullBackupZip } from "./backup-archiver";
import { uploadToGoogleDrive } from "./gdrive-sync";
import { storage } from "@/server/storage";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
const INITIAL_DELAY_MS = 15 * 1000; // Initial check 15 seconds after server boot

export function getMostRecentTargetSchedule(now: Date, frequency: "weekly" | "monthly"): Date {
  const target = new Date(now);
  target.setHours(1, 0, 0, 0); // 1:00 AM

  if (frequency === "monthly") {
    target.setDate(1); // 1st of current month at 1:00 AM
    if (now < target) {
      // 1st of previous month
      target.setMonth(target.getMonth() - 1);
    }
  } else {
    // Weekly (Sunday at 1:00 AM)
    const day = now.getDay(); // 0 is Sunday
    target.setDate(now.getDate() - day); // Move back to Sunday
    if (now < target) {
      target.setDate(target.getDate() - 7);
    }
  }
  return target;
}

export function getNextTargetSchedule(now: Date, frequency: "weekly" | "monthly"): Date {
  const target = new Date(now);
  target.setHours(1, 0, 0, 0); // 1:00 AM

  if (frequency === "monthly") {
    target.setDate(1);
    if (now >= target) {
      target.setMonth(target.getMonth() + 1);
    }
  } else {
    // Weekly: Next Sunday at 1:00 AM
    const day = now.getDay();
    const daysUntilSunday = (7 - day) % 7;
    if (daysUntilSunday === 0 && now >= target) {
      target.setDate(now.getDate() + 7);
    } else {
      target.setDate(now.getDate() + daysUntilSunday);
    }
  }
  return target;
}

export function isBackupDue(lastBackupTimeMs: number, frequency: "weekly" | "monthly" = "weekly"): boolean {
  if (!lastBackupTimeMs || isNaN(lastBackupTimeMs)) return true;
  const now = new Date();
  const recentTarget = getMostRecentTargetSchedule(now, frequency);
  return lastBackupTimeMs < recentTarget.getTime();
}

export async function runAutoBackupCheck() {
  try {
    const settings = await storage.getStoreSettings();
    const frequency = settings.backupFrequency || "weekly";

    if (frequency === "disabled") {
      return;
    }

    const logs = await storage.getBackupLogs(1);
    const lastLog = logs?.[0];
    const lastTime = lastLog ? new Date(lastLog.created_at || lastLog.timestamp || 0).getTime() : 0;

    const due = isBackupDue(lastTime, frequency);

    if (!due) {
      return;
    }

    console.log("[AutoBackupScheduler] Scheduled database backup starting (Sunday 1:00 AM / 1st of month)...");
    const archiveRes = await createFullBackupZip();

    let gdriveSyncRes: any = { ok: false, message: "Google Drive sync not configured", trigger: "cron" };

    if (archiveRes.ok && archiveRes.zipBuffer) {
      const uploadRes = await uploadToGoogleDrive({
        fileName: archiveRes.fileName!,
        fileBuffer: archiveRes.zipBuffer,
      });
      gdriveSyncRes = { ...uploadRes, trigger: "cron" };
    }

    const status = archiveRes.ok ? "success" : "failed";

    await storage.createBackupLog({
      status,
      fileName: archiveRes.fileName || null,
      sizeBytes: archiveRes.totalSizeBytes || 0,
      masterStatus: JSON.stringify(gdriveSyncRes),
      userStatus: JSON.stringify(gdriveSyncRes),
      errors: archiveRes.errors || [],
    });

    console.log(`[AutoBackupScheduler] Scheduled backup finished. Status: ${status}, File: ${archiveRes.fileName}`);
  } catch (error) {
    console.error("[AutoBackupScheduler] Error running automatic backup check:", error);
  }
}

export function initAutoBackupScheduler() {
  if ((globalThis as any).__autoBackupSchedulerStarted) {
    return;
  }
  (globalThis as any).__autoBackupSchedulerStarted = true;

  console.log("[AutoBackupScheduler] In-server automated backup scheduler initialized (Sunday 1:00 AM / 1st of month).");

  setTimeout(() => {
    runAutoBackupCheck();
    setInterval(runAutoBackupCheck, CHECK_INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}
