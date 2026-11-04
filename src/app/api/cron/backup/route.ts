import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { isSuperAdminUser } from "@/server/super-admin";
import { createFullBackupZip } from "@/server/backup/backup-archiver";
import { uploadToGoogleDrive } from "@/server/backup/gdrive-sync";
import { storage } from "@/server/storage";

export async function getBackupHistory(): Promise<any[]> {
  try {
    const logs = await storage.getBackupLogs(50);
    return (logs || []).map((l: any) => ({
      id: l.id,
      timestamp: l.created_at || l.timestamp,
      status: l.status,
      fileName: l.file_name,
      sizeBytes: l.size_bytes,
      masterGdrive: l.master_status ? JSON.parse(l.master_status) : null,
      userGdrive: l.user_status ? JSON.parse(l.user_status) : null,
      gdrive: l.master_status ? JSON.parse(l.master_status) : null,
      errors: l.errors ? JSON.parse(l.errors) : [],
    }));
  } catch {
    return [];
  }
}

async function handleBackupExecution(req: NextRequest) {
  const startTime = new Date();
  
  // Execute in-memory database export & zip packaging (zero disk retention)
  const archiveRes = await createFullBackupZip();

  let gdriveSyncRes: any = { ok: false, message: "Google Drive sync not executed", trigger: "cron" };

  if (archiveRes.ok && archiveRes.zipBuffer) {
    const uploadRes = await uploadToGoogleDrive({
      fileName: archiveRes.fileName!,
      fileBuffer: archiveRes.zipBuffer,
    });
    gdriveSyncRes = { ...uploadRes, trigger: "cron" };
  }

  const status = archiveRes.ok ? "success" : "failed";

  // Log execution entry to Supabase database (no local disk files created)
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
    message: archiveRes.ok ? "Backup completed successfully" : "Backup finished with errors",
    backup: historyEntry,
  });
}

function verifyCronOrSuperAdmin(req: NextRequest, auth: any): boolean {
  const secretParam = req.nextUrl.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "clothinv_backup_secret";

  if (secretParam === cronSecret || authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (auth.ok && isSuperAdminUser(auth.user)) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  const isAllowed = verifyCronOrSuperAdmin(req, auth);

  if (!isAllowed) {
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  return handleBackupExecution(req);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  const isAllowed = verifyCronOrSuperAdmin(req, auth);

  if (!isAllowed) {
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  return handleBackupExecution(req);
}

