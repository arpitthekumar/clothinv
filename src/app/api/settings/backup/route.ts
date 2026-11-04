import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { isSuperAdminUser } from "@/server/super-admin";
import { createFullBackupZip } from "@/server/backup/backup-archiver";
import { uploadToGoogleDrive, getGoogleDriveEnvInfo } from "@/server/backup/gdrive-sync";
import { storage } from "@/server/storage";
import { storeTempBackupZip } from "@/server/backup/temp-download-cache";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdminUser(auth.user)) {
    return NextResponse.json(
      { error: "Forbidden: Only Super Admin users can access backup management." },
      { status: 403 }
    );
  }

  try {
    const rawLogs = await storage.getBackupLogs(50);
    const history = (rawLogs || []).map((l: any) => {
      const masterGdrive = l.master_status ? JSON.parse(l.master_status) : null;
      const userGdrive = l.user_status ? JSON.parse(l.user_status) : null;
      const gdrive = userGdrive || masterGdrive;
      const trigger = masterGdrive?.trigger || userGdrive?.trigger || (l.file_name?.includes("cron") ? "cron" : "manual");
      return {
        id: l.id,
        timestamp: l.created_at || l.timestamp,
        status: l.status,
        fileName: l.file_name,
        sizeBytes: l.size_bytes,
        trigger,
        masterGdrive,
        userGdrive,
        gdrive,
        errors: l.errors ? JSON.parse(l.errors) : [],
      };
    });

    const gdriveEnv = getGoogleDriveEnvInfo();

    return NextResponse.json({
      history,
      gdriveEnv,
      isSuperAdmin: true,
    });
  } catch (error: any) {
    return NextResponse.json({
      history: [],
      gdriveEnv: getGoogleDriveEnvInfo(),
      isSuperAdmin: true,
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdminUser(auth.user)) {
    return NextResponse.json(
      { error: "Forbidden: Only Super Admin users can trigger manual backups." },
      { status: 403 }
    );
  }

  try {
    const startTime = new Date();
    // Zero-disk memory ZIP package creation
    const archiveRes = await createFullBackupZip();

    let gdriveSyncRes: any = { ok: false, message: "Google Drive sync not configured", trigger: "manual" };
    let downloadInfo: { token: string; expiresAt: number } | null = null;

    if (archiveRes.ok && archiveRes.zipBuffer) {
      downloadInfo = storeTempBackupZip(
        `bk_${Date.now()}`,
        archiveRes.fileName || `backup-${Date.now()}.zip`,
        archiveRes.zipBuffer
      );

      const uploadRes = await uploadToGoogleDrive({
        fileName: archiveRes.fileName!,
        fileBuffer: archiveRes.zipBuffer,
      });
      gdriveSyncRes = { ...uploadRes, trigger: "manual" };
    }

    const status = archiveRes.ok ? "success" : "failed";

    // Write log entry directly to Supabase database (no local disk files created)
    const logEntry = await storage.createBackupLog({
      status,
      fileName: archiveRes.fileName || null,
      sizeBytes: archiveRes.totalSizeBytes || 0,
      masterStatus: JSON.stringify(gdriveSyncRes),
      userStatus: JSON.stringify(gdriveSyncRes),
      errors: archiveRes.errors || [],
    });

    const historyEntry = {
      id: logEntry?.id || `bk_${Date.now()}`,
      timestamp: startTime.toISOString(),
      status,
      fileName: archiveRes.fileName || null,
      sizeBytes: archiveRes.totalSizeBytes || 0,
      masterGdrive: gdriveSyncRes,
      userGdrive: gdriveSyncRes,
      gdrive: gdriveSyncRes,
      errors: archiveRes.errors || [],
    };

    return NextResponse.json({
      ok: archiveRes.ok,
      message: archiveRes.ok ? "Backup generated successfully" : "Backup finished with errors",
      backup: historyEntry,
      downloadToken: downloadInfo?.token || null,
      downloadExpiresAt: downloadInfo?.expiresAt || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to trigger backup" }, { status: 500 });
  }
}
