import { CANONICAL_PUBLIC_TABLES } from "./constants";
import { backupLogger } from "./logger";

/** PostgREST / Supabase exposes table paths in the OpenAPI document. */
const OPENAPI_ACCEPT = "application/openapi+json";

function normalizeSupabaseRestBase(url: string): string {
  const u = url.replace(/\/$/, "");
  if (u.endsWith("/rest/v1")) return u;
  return `${u}/rest/v1`;
}

function pathToTableName(pathKey: string): string | null {
  const p = pathKey.startsWith("/") ? pathKey.slice(1) : pathKey;
  if (!p || p.includes("/")) return null;
  if (p.startsWith("rpc")) return null;
  return p;
}

/**
 * Lists public tables exposed by PostgREST (same as API-accessible tables).
 * Merges with {@link CANONICAL_PUBLIC_TABLES} so nothing from the curated list is dropped
 * if OpenAPI omits a path (edge builds / permissions).
 */
export async function discoverTablesFromOpenApi(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): Promise<{
  tables: string[];
  fromOpenApi: string[];
  openApiNameSet: Set<string>;
  error?: string;
}> {
  const base = normalizeSupabaseRestBase(params.supabaseUrl);
  const openApiUrl = `${base}/`;

  try {
    const res = await fetch(openApiUrl, {
      method: "GET",
      headers: {
        Accept: OPENAPI_ACCEPT,
        apikey: params.serviceRoleKey,
        Authorization: `Bearer ${params.serviceRoleKey}`,
      },
    });

    if (!res.ok) {
      const err = `OpenAPI fetch failed: ${res.status} ${res.statusText}`;
      backupLogger.warn(err, { openApiUrl });
      return mergeWithCanonical([], [], err);
    }

    const doc = (await res.json()) as {
      paths?: Record<string, unknown>;
    };

    const paths = doc.paths ?? {};
    const fromApi: string[] = [];

    for (const pathKey of Object.keys(paths)) {
      const name = pathToTableName(pathKey);
      if (name) fromApi.push(name);
    }

    fromApi.sort((a, b) => a.localeCompare(b));
    backupLogger.info("OpenAPI discovery complete", {
      count: fromApi.length,
    });

    return mergeWithCanonical(fromApi, fromApi);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    backupLogger.warn("OpenAPI discovery threw; using canonical table list only", {
      message: msg,
    });
    return mergeWithCanonical([], [], msg);
  }
}

function mergeWithCanonical(
  fromOpenApi: string[],
  openApiForSet: string[],
  error?: string
): {
  tables: string[];
  fromOpenApi: string[];
  openApiNameSet: Set<string>;
  error?: string;
} {
  const set = new Set<string>([...CANONICAL_PUBLIC_TABLES, ...fromOpenApi]);
  const merged = [...set].sort((a, b) => a.localeCompare(b));
  return {
    tables: merged,
    fromOpenApi,
    openApiNameSet: new Set(openApiForSet),
    error,
  };
}
