/**
 * Resolves secondary Supabase credentials from env.
 * Supports standard names plus legacy mistaken prefixes (e.g. clothinv-SUPABASE_*).
 */
function t(name: string): string | undefined {
  return process.env[name]?.trim();
}

export function getSecondarySupabaseUrl(): string | undefined {
  return (
    t("SUPABASE_URL_SECONDARY") ||
    t("NEXT_PUBLIC_SUPABASE_URL_SECONDARY") ||
    t("clothinv-SUPABASE_URL_SECONDARY") ||
    t("clothinv-NEXT_PUBLIC_SUPABASE_URL_SECONDARY")
  );
}

export function getSecondarySupabaseKey(): string | undefined {
  return (
    t("SUPABASE_SERVICE_ROLE_KEY_SECONDARY") ||
    t("SUPABASE_ANON_KEY_SECONDARY") ||
    t("clothinv-SUPABASE_SERVICE_ROLE_KEY_SECONDARY") ||
    t("clothinv-SUPABASE_ANON_KEY_SECONDARY")
  );
}

export function isSecondarySupabaseConfigured(): boolean {
  return Boolean(getSecondarySupabaseUrl() && getSecondarySupabaseKey());
}
