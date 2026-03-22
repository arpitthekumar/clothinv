import {
  getSecondarySupabaseKey,
  getSecondarySupabaseUrl,
} from "../supabase-env";
import { backupLogger } from "./logger";

export type BackupEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  /** Default ./backups */
  outputDir: string;
  pageSize: number;
  insertBatchSize: number;
};

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** JWT payload role (unverified decode for logging only). */
export function jwtRoleHint(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function resolveBackupEnv(): BackupEnv {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim() || !serviceRoleKey?.trim()) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and a Supabase API key (SUPABASE_SERVICE_ROLE_KEY recommended)."
    );
  }

  const role = jwtRoleHint(serviceRoleKey);
  if (role && role !== "service_role") {
    backupLogger.warn(
      "Using a non–service-role key. Row Level Security may block reads/writes; use SUPABASE_SERVICE_ROLE_KEY for backups."
    );
  }

  return {
    supabaseUrl: supabaseUrl.trim(),
    serviceRoleKey: serviceRoleKey.trim(),
    outputDir: process.env.BACKUP_OUTPUT_DIR?.trim() || "./backups",
    pageSize: intEnv("BACKUP_PAGE_SIZE", 1000),
    insertBatchSize: intEnv("BACKUP_INSERT_BATCH", 500),
  };
}

export function resolveRestoreTargetEnv(options?: {
  /** Use SUPABASE_*_SECONDARY from env (new project). */
  useSecondary?: boolean;
}): BackupEnv {
  const useSecondary = options?.useSecondary ?? false;

  let targetUrl: string | undefined;
  let targetKey: string | undefined;

  if (useSecondary) {
    targetUrl = getSecondarySupabaseUrl();
    targetKey = getSecondarySupabaseKey();
    if (!targetUrl || !targetKey) {
      throw new Error(
        "Secondary Supabase is not configured. Set SUPABASE_URL_SECONDARY and SUPABASE_SERVICE_ROLE_KEY_SECONDARY (or anon) in .env.local."
      );
    }
    backupLogger.info("Restore target: secondary Supabase project", {
      host: new URL(targetUrl).host,
    });
  } else {
    targetUrl =
      process.env.TARGET_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    targetKey =
      process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!targetUrl || !targetKey) {
      throw new Error(
        "Restore needs TARGET_SUPABASE_URL + TARGET_SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_* for primary, or pass --target-secondary with secondary env set."
      );
    }
  }

  const role = jwtRoleHint(targetKey);
  if (role && role !== "service_role") {
    backupLogger.warn(
      "Restore target uses a non–service-role key; RLS may block inserts."
    );
  }

  return {
    supabaseUrl: targetUrl,
    serviceRoleKey: targetKey,
    outputDir: process.env.BACKUP_OUTPUT_DIR?.trim() || "./backups",
    pageSize: intEnv("BACKUP_PAGE_SIZE", 1000),
    insertBatchSize: intEnv("BACKUP_INSERT_BATCH", 500),
  };
}
