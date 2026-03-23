import { createClient } from "@supabase/supabase-js";

import { RESTORE_DELETE_ORDER } from "./constants";
import { backupLogger } from "./logger";
import {
  getSecondarySupabaseKey,
  getSecondarySupabaseUrl,
} from "../supabase-env";

/** UUID that no row should use — enables PostgREST delete-all pattern. */
const IMPOSSIBLE_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Removes all application rows from the secondary Supabase project (FK-safe order).
 * Requires service role. Does not drop schema or RPCs.
 */
export async function clearSecondaryDatabase(): Promise<void> {
  const url = getSecondarySupabaseUrl();
  const key = getSecondarySupabaseKey();
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Secondary Supabase URL or key is not configured.");
  }

  const client = createClient(url.trim(), key.trim(), {
    auth: { persistSession: false },
  });

  for (const table of RESTORE_DELETE_ORDER) {
    backupLogger.info(`Clearing secondary table: ${table}`);
    const { error } = await client.from(table).delete().neq("id", IMPOSSIBLE_ID);
    if (error) {
      throw new Error(`clearSecondaryDatabase failed on "${table}": ${error.message}`);
    }
  }

  backupLogger.info("Secondary database tables cleared.");
}
