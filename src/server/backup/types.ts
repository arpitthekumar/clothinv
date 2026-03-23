/** Backup manifest version — bump when format changes. */
export const BACKUP_MANIFEST_VERSION = 1 as const;

export type BackupTableMeta = {
  name: string;
  rowCount: number;
  /** True when this table appeared in PostgREST OpenAPI paths (before merge with canonical). */
  seenInOpenApi: boolean;
};

export type BackupManifest = {
  version: typeof BACKUP_MANIFEST_VERSION;
  createdAt: string;
  /** Host only (no secrets), e.g. xyzcompany.supabase.co */
  sourceSupabaseHost: string;
  tables: BackupTableMeta[];
  /** Table names returned from PostgREST OpenAPI paths (empty if --canonical-only). */
  openApiTableNames: string[];
  /** Curated list from app schema (SETUP_DATABASE.sql + storage layer) */
  canonicalTableNames: string[];
  /** Tables in manifest order not in canonical list (restore may need manual FK ordering) */
  unknownTableNames: string[];
};

export type BackupTableResult = {
  name: string;
  rowCount: number;
  ok: boolean;
  error?: string;
};

export type BackupRunResult = {
  ok: boolean;
  outputDir: string;
  manifestPath: string;
  tables: BackupTableResult[];
  errors: string[];
};

export type RestoreTableResult = {
  name: string;
  inserted: number;
  ok: boolean;
  error?: string;
};

export type RestoreRunResult = {
  ok: boolean;
  tables: RestoreTableResult[];
  errors: string[];
};
