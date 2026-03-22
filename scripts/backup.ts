/**
 * CLI: export Supabase table data to JSON Lines under BACKUP_OUTPUT_DIR.
 *
 * Usage:
 *   npx tsx scripts/backup.ts [--canonical-only] [--continue-on-error]
 *
 * Env: see src/server/backup/env.ts (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { runBackup } from "../src/server/backup/export";

function parseArgs(argv: string[]) {
  let canonicalOnly = false;
  let continueOnError = false;
  for (const a of argv) {
    if (a === "--canonical-only") canonicalOnly = true;
    if (a === "--continue-on-error") continueOnError = true;
  }
  if (process.env.BACKUP_CONTINUE_ON_ERROR === "1") continueOnError = true;
  return { canonicalOnly, continueOnError };
}

async function main() {
  const { canonicalOnly, continueOnError } = parseArgs(process.argv.slice(2));

  try {
    const result = await runBackup({ canonicalOnly, continueOnError });

    if (result.ok) {
      console.log(
        `[backup] Success. Output: ${result.outputDir}\n[backup] Manifest: ${result.manifestPath}`
      );
      process.exit(0);
    }

    console.error("[backup] Completed with errors.");
    for (const e of result.errors) console.error(`  - ${e}`);
    console.error(`[backup] Partial output: ${result.outputDir}`);
    process.exit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[backup] Fatal: ${msg}`);
    process.exit(1);
  }
}

void main();
