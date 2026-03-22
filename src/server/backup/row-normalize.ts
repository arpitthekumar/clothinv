/**
 * PostgREST / Supabase may return rows with camelCase keys (matching app types).
 * PostgreSQL columns are snake_case. Convert top-level keys only so nested JSON
 * (e.g. sales.items) stays unchanged.
 */
export function topLevelKeysToSnakeCase(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const snake = k
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");
    out[snake] = v;
  }
  return out;
}
