export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initAutoBackupScheduler } = await import("@/server/backup/auto-scheduler");
    initAutoBackupScheduler();
  }
}
