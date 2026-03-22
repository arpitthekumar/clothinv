import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

import {
  getSecondarySupabaseKey,
  getSecondarySupabaseUrl,
} from "./supabase-env";

/** Profile selected via cookie (middleware → header). Scripts / non-request contexts use primary. */
export type SupabaseProfile = "primary" | "secondary";

const HEADER_PROFILE = "x-clothinv-supabase-profile";

function primaryUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
}

function primaryKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function secondaryUrl(): string | undefined {
  return getSecondarySupabaseUrl();
}

function secondaryKey(): string | undefined {
  return getSecondarySupabaseKey();
}

function validateUrl(url: string): boolean {
  try {
    new globalThis.URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function resolveActiveProfile(): Promise<SupabaseProfile> {
  try {
    const h = await headers();
    const v = h.get(HEADER_PROFILE);
    if (v === "secondary") return "secondary";
  } catch {
    // Not in a request (e.g. standalone script) — default to primary
  }
  return "primary";
}

/**
 * Server-side Supabase client for the active profile (cookie + env).
 * Must be awaited. Outside a Next request, uses primary credentials.
 */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  const profile = await resolveActiveProfile();

  const url =
    profile === "secondary"
      ? secondaryUrl() || primaryUrl()
      : primaryUrl();
  const key =
    profile === "secondary"
      ? secondaryKey() || primaryKey()
      : primaryKey();

  if (!url || !key) {
    console.error("❌ Supabase configuration missing for profile:", profile);
    return null;
  }

  if (!validateUrl(url)) {
    console.error("❌ Invalid Supabase URL format:", url);
    return null;
  }

  if (profile === "secondary" && (!secondaryUrl() || !secondaryKey())) {
    console.warn(
      "⚠️ Secondary Supabase env not fully set; falling back to primary URL/key."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** True when primary Supabase URL + key are set (required for the app). */
export const hasSupabase = Boolean(primaryUrl() && primaryKey());

