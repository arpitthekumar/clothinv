/**
 * CLI: restore a backup folder (manifest + tables/*.jsonl) into a Supabase project.
 *
 * Usage:
 *   npx tsx scripts/restore.ts --manifest <path/to/manifest.json> [--dry-run] [--confirm] [--continue-on-error]
 *
 * Safety:
 *   - Live inserts require --confirm OR RESTORE_CONFIRM=yes (or true/1).
 *   - Use TARGET_SUPABASE_URL + TARGET_SUPABASE_SERVICE_ROLE_KEY for a custom project, or
 *     --target-secondary to load SUPABASE_URL_SECONDARY + SUPABASE_SERVICE_ROLE_KEY_SECONDARY from .env.
 *   - Assumes an empty database with schema (and RPC SQL) already applied — see src/server/backup/RPC.md.
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import path from "path";

import { runRestore } from "../src/server/backup/import";

function parseArgs(argv: string[]) {
  let manifestPath = "";
  let dryRun = false;
  let confirm = false;
  let continueOnError = false;
  let targetSecondary = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--manifest") {
      manifestPath = argv[++i] ?? "";
      continue;
    }
    if (a === "--dry-run") dryRun = true;
    if (a === "--confirm") confirm = true;
    if (a === "--continue-on-error") continueOnError = true;
    if (a === "--target-secondary") targetSecondary = true;
  }

  const envConfirm = ["yes", "true", "1"].includes(
    (process.env.RESTORE_CONFIRM || "").toLowerCase()
  );
  if (envConfirm) confirm = true;
  if (process.env.RESTORE_CONTINUE_ON_ERROR === "1") continueOnError = true;

  return { manifestPath, dryRun, confirm, continueOnError, targetSecondary };
}

async function main() {
  const { manifestPath, dryRun, confirm, continueOnError, targetSecondary } =
    parseArgs(process.argv.slice(2));

  if (!manifestPath.trim()) {
    console.error(
      "[restore] Missing --manifest <path/to/manifest.json> (absolute or relative to cwd)."
    );
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), manifestPath);

  try {
    const result = await runRestore({
      manifestPath: resolved,
      dryRun,
      confirmed: confirm,
      continueOnError,
      targetSecondary,
    });

    if (result.ok) {
      console.log("[restore] Finished successfully.");
      for (const t of result.tables) {
        console.log(`  - ${t.name}: ${t.inserted} row(s)`);
      }
      process.exit(0);
    }

    console.error("[restore] Finished with errors.");
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[restore] Fatal: ${msg}`);
    process.exit(1);
  }
}

void main();
