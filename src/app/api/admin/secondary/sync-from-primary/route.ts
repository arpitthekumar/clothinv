import { NextResponse } from "next/server";

import { clearSecondaryDatabase } from "@server/backup/clear-secondary";
import { runBackup } from "@server/backup/export";
import { runRestore } from "@server/backup/import";
import { isSecondarySupabaseConfigured } from "@server/supabase-env";
import { isSuperAdminUser } from "@server/super-admin";
import { requireAuth } from "../../../_lib/session";

/** Long-running: backup + clear + restore (self-hosted / Node). */
export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (!isSuperAdminUser(auth.user)) {
    return NextResponse.json(
      { error: "Only the super admin can run secondary sync." },
      { status: 403 }
    );
  }

  if (!isSecondarySupabaseConfigured()) {
    return NextResponse.json(
      { error: "Secondary Supabase is not configured in the environment." },
      { status: 400 }
    );
  }

  let body: { confirm?: string };
  try {
    body = (await req.json()) as { confirm?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.confirm !== "RESET_SECONDARY") {
    return NextResponse.json(
      {
        error: 'Confirmation required: send JSON { "confirm": "RESET_SECONDARY" }',
      },
      { status: 400 }
    );
  }

  const backup = await runBackup({ continueOnError: false });
  if (!backup.ok || !backup.manifestPath) {
    return NextResponse.json(
      {
        error: "Backup from primary failed; secondary was not modified.",
        details: backup.errors,
      },
      { status: 500 }
    );
  }

  try {
    await clearSecondaryDatabase();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "Failed to clear secondary database.",
        message: msg,
        manifestPath: backup.manifestPath,
      },
      { status: 500 }
    );
  }

  const restore = await runRestore({
    manifestPath: backup.manifestPath,
    dryRun: false,
    confirmed: true,
    continueOnError: false,
    targetSecondary: true,
  });

  if (!restore.ok) {
    return NextResponse.json(
      {
        error:
          "Restore to secondary failed. Secondary may be empty or partial. Check manifest and re-run restore manually.",
        details: restore.errors,
        manifestPath: backup.manifestPath,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    backupDir: backup.outputDir,
    manifestPath: backup.manifestPath,
    tables: restore.tables,
  });
}
