import { createWriteStream } from "fs";
import { finished } from "stream/promises";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { CANONICAL_PUBLIC_TABLES } from "./constants";
import { discoverTablesFromOpenApi } from "./discover";
import { resolveBackupEnv } from "./env";
import { backupLogger } from "./logger";
import {
  BACKUP_MANIFEST_VERSION,
  type BackupManifest,
  type BackupRunResult,
  type BackupTableMeta,
  type BackupTableResult,
} from "./types";

function hostOnly(supabaseUrl: string): string {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return "unknown";
  }
}

async function exportTableJsonl(params: {
  client: SupabaseClient;
  table: string;
  pageSize: number;
  outFile: string;
}): Promise<{ rowCount: number; error?: string }> {
  const { client, table, pageSize, outFile } = params;
  let rowCount = 0;
  let offset = 0;

  const stream = createWriteStream(outFile, { flags: "w" });

  try {
    while (true) {
      const to = offset + pageSize - 1;
      const { data, error } = await client
        .from(table)
        .select("*")
        .range(offset, to);

      if (error) {
        await new Promise<void>((res) => {
          stream.end(() => res());
        });
        return { rowCount, error: error.message };
      }

      const rows = data ?? [];
      if (rows.length === 0) break;

      for (const row of rows) {
        stream.write(`${JSON.stringify(row)}\n`);
        rowCount++;
      }

      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    stream.end();
    await finished(stream);
    return { rowCount };
  } catch (e) {
    stream.destroy();
    const msg = e instanceof Error ? e.message : String(e);
    return { rowCount, error: msg };
  }
}

export async function runBackup(options?: {
  /** Skip OpenAPI discovery; export canonical tables only. */
  canonicalOnly?: boolean;
  /** Continue after a table failure (default false). */
  continueOnError?: boolean;
}): Promise<BackupRunResult> {
  const env = resolveBackupEnv();
  const client = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false },
  });

  const continueOnError = options?.continueOnError ?? false;
  const errors: string[] = [];
  const tableResults: BackupTableResult[] = [];

  let discovered: string[] = [];
  let discoveryError: string | undefined;
  let openApiTableNames: string[] = [];
  const openApiNameSet = new Set<string>();

  if (options?.canonicalOnly) {
    discovered = [...CANONICAL_PUBLIC_TABLES];
    backupLogger.info("Using canonical table list only (--canonical-only).");
  } else {
    const d = await discoverTablesFromOpenApi({
      supabaseUrl: env.supabaseUrl,
      serviceRoleKey: env.serviceRoleKey,
    });
    discovered = d.tables;
    openApiTableNames = d.fromOpenApi;
    for (const n of d.openApiNameSet) openApiNameSet.add(n);
    discoveryError = d.error;
    if (discoveryError) {
      backupLogger.warn("Discovery note", { discoveryError });
    }
  }

  const canonicalSet = new Set(CANONICAL_PUBLIC_TABLES);
  const unknownTableNames = discovered.filter((t) => !canonicalSet.has(t));

  if (unknownTableNames.length > 0) {
    backupLogger.warn(
      "Discovered tables not in canonical list — restore order may need manual adjustment if FKs fail.",
      { tables: unknownTableNames }
    );
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(env.outputDir, `backup-${stamp}`);
  const tablesDir = path.join(runDir, "tables");
  await mkdir(tablesDir, { recursive: true });

  backupLogger.info("Starting export", {
    runDir,
    tableCount: discovered.length,
    pageSize: env.pageSize,
  });

  const tableMetas: BackupTableMeta[] = [];

  for (const table of discovered) {
    const outFile = path.join(tablesDir, `${table}.jsonl`);
    backupLogger.info(`Exporting table: ${table}`);

    const { rowCount, error } = await exportTableJsonl({
      client,
      table,
      pageSize: env.pageSize,
      outFile,
    });

    const ok = !error;
    tableResults.push({ name: table, rowCount, ok, error });
    tableMetas.push({
      name: table,
      rowCount,
      seenInOpenApi: options?.canonicalOnly ? false : openApiNameSet.has(table),
    });

    if (error) {
      const msg = `Table "${table}": ${error}`;
      errors.push(msg);
      backupLogger.error(msg);
      if (!continueOnError) {
        break;
      }
    } else {
      backupLogger.info(`Table "${table}" done`, { rowCount });
    }
  }

  const manifest: BackupManifest = {
    version: BACKUP_MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    sourceSupabaseHost: hostOnly(env.supabaseUrl),
    tables: tableMetas,
    openApiTableNames,
    canonicalTableNames: [...CANONICAL_PUBLIC_TABLES],
    unknownTableNames,
  };

  const manifestPath = path.join(runDir, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  backupLogger.info("Wrote manifest", { manifestPath });

  const ok = errors.length === 0;

  return {
    ok,
    outputDir: runDir,
    manifestPath,
    tables: tableResults,
    errors,
  };
}
