import { createClient } from "@supabase/supabase-js";

const URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) as string | undefined;

export function getSupabaseServer() {
  if (!URL || !KEY) {
    console.error('❌ Supabase configuration missing');
    return null;
  }
  
  // Validate URL format
  try {
    new globalThis.URL(URL);
  } catch (error) {
    console.error('❌ Invalid Supabase URL format:', URL);
    return null;
  }
  
  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}

export const hasSupabase = Boolean(URL && KEY);


