import { createReadStream } from "fs";
import { access, readFile } from "fs/promises";
import path from "path";
import readline from "readline";

import { createClient } from "@supabase/supabase-js";

import { sortTablesForRestore } from "./constants";
import { resolveRestoreTargetEnv } from "./env";
import { backupLogger } from "./logger";
import { topLevelKeysToSnakeCase } from "./row-normalize";
import {
  BACKUP_MANIFEST_VERSION,
  type BackupManifest,
  type RestoreRunResult,
  type RestoreTableResult,
} from "./types";

async function readManifest(manifestPath: string): Promise<BackupManifest> {
  const raw = await readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as BackupManifest;
  if (parsed.version !== BACKUP_MANIFEST_VERSION) {
    backupLogger.warn("Manifest version differs from tool", {
      manifest: parsed.version,
      expected: BACKUP_MANIFEST_VERSION,
    });
  }
  return parsed;
}

function parseJsonlBatch(
  lines: string[]
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    try {
      rows.push(JSON.parse(t) as Record<string, unknown>);
    } catch (e) {
      throw new Error(
        `Invalid JSON line: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
  return rows;
}

async function* iterateJsonlBatches(
  filePath: string,
  batchSize: number
): AsyncGenerator<Record<string, unknown>[]> {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let batch: string[] = [];

  for await (const line of rl) {
    batch.push(line);
    if (batch.length >= batchSize) {
      yield parseJsonlBatch(batch);
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield parseJsonlBatch(batch);
  }
}

export async function runRestore(options: {
  manifestPath: string;
  dryRun: boolean;
  /** When true, actually write rows (requires dryRun false). */
  confirmed: boolean;
  continueOnError?: boolean;
  /** Insert into secondary Supabase (SUPABASE_*_SECONDARY) instead of primary / TARGET_*. */
  targetSecondary?: boolean;
}): Promise<RestoreRunResult> {
  if (!options.confirmed && !options.dryRun) {
    throw new Error(
      "Refusing to restore without confirmation. Pass --confirm or set RESTORE_CONFIRM=yes, or use --dry-run."
    );
  }

  const manifest = await readManifest(options.manifestPath);
  const tablesDir = path.join(path.dirname(options.manifestPath), "tables");
  const env = resolveRestoreTargetEnv({
    useSecondary: options.targetSecondary ?? false,
  });
  const client = options.dryRun
    ? null
    : createClient(env.supabaseUrl, env.serviceRoleKey, {
        auth: { persistSession: false },
      });

  const names = manifest.tables.map((t) => t.name);
  const ordered = sortTablesForRestore(names);
  const continueOnError = options.continueOnError ?? false;
  const errors: string[] = [];
  const tableResults: RestoreTableResult[] = [];

  backupLogger.info("Restore plan", {
    dryRun: options.dryRun,
    tableCount: ordered.length,
    targetHost: new URL(env.supabaseUrl).host,
    insertBatchSize: env.insertBatchSize,
  });

  for (const table of ordered) {
    const filePath = path.join(tablesDir, `${table}.jsonl`);
    let inserted = 0;

    try {
      await access(filePath);
    } catch {
      const msg = `Missing file for table "${table}": ${filePath}`;
      errors.push(msg);
      backupLogger.error(msg);
      tableResults.push({ name: table, inserted: 0, ok: false, error: msg });
      if (!continueOnError) {
        return { ok: false, tables: tableResults, errors };
      }
      continue;
    }

    if (options.dryRun) {
      let lines = 0;
      const stream = createReadStream(filePath, { encoding: "utf8" });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of rl) {
        void line;
        lines++;
      }
      backupLogger.info(`[dry-run] Would insert ${lines} row(s) into "${table}"`);
      tableResults.push({ name: table, inserted: lines, ok: true });
      continue;
    }

    if (!client) {
      throw new Error("Internal: Supabase client not initialized for restore.");
    }

    backupLogger.info(`Restoring table: ${table}`);

    try {
      for await (const batch of iterateJsonlBatches(
        filePath,
        env.insertBatchSize
      )) {
        if (batch.length === 0) continue;

        const snakeBatch = batch.map((row) => topLevelKeysToSnakeCase(row));
        const { error } = await client.from(table).insert(snakeBatch);
        if (error) {
          throw new Error(error.message);
        }
        inserted += batch.length;
      }

      backupLogger.info(`Table "${table}" restored`, { inserted });
      tableResults.push({ name: table, inserted, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Table "${table}": ${msg}`);
      backupLogger.error(`Restore failed for "${table}"`, { message: msg });
      tableResults.push({ name: table, inserted, ok: false, error: msg });
      if (!continueOnError) {
        return { ok: false, tables: tableResults, errors };
      }
    }
  }

  const ok = errors.length === 0;
  return { ok, tables: tableResults, errors };
}
