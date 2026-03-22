# Supabase RPC functions and backups

Row data exported by the CLI covers **PostgREST-accessible tables** only. **PostgreSQL functions** exposed as RPC (for example `profit_margins`, used in `src/server/storage.supabase.ts`) are **not** exported automatically.

## Why RPC is separate

- RPC definitions live in the database as `CREATE FUNCTION` / `CREATE OR REPLACE FUNCTION`, not as table rows.
- The backup CLI uses the JS client and/or OpenAPI discovery; it does not run arbitrary SQL or dump the `pg_proc` catalog.

## How to preserve RPC when moving projects

1. **Source of truth in repo**  
   If you add or change functions, save the SQL in a file you version (for example alongside `SETUP_DATABASE.sql` or a dedicated `sql/rpc/` folder) and apply it in the Supabase SQL editor or via migration tooling.

2. **Export from an existing project**  
   In Supabase Dashboard → **SQL** → query `pg_get_functiondef(oid)` for your function, or use **Database** → backups / **Supabase CLI** `db dump` for a full SQL dump that includes functions.

3. **Restore order**  
   Apply schema + **RPC SQL before or after** table restore as appropriate. For `profit_margins`, the app expects the function to exist before reports call `rpc('profit_margins', …)`; typically you run `SETUP_DATABASE.sql` + RPC SQL on the **empty** new project, then run **restore** to insert rows.

4. **Restore into the secondary Supabase project** (from `.env.local`)  
   `npm run restore -- --manifest backups/<folder>/manifest.json --target-secondary --dry-run` then add `--confirm` to insert.  
   Requires `SUPABASE_URL_SECONDARY` and `SUPABASE_SERVICE_ROLE_KEY_SECONDARY`.

4. **Verification**  
   After restore, run a quick report or `select profit_margins(...)` in the SQL editor to confirm the function exists and matches the old behavior.

## Summary

| Asset              | CLI JSON backup | Recommended extra step        |
|--------------------|-----------------|-------------------------------|
| Table rows         | Yes             | —                             |
| RPC / functions    | No              | SQL dump or versioned `.sql`  |
| Triggers, policies | No              | Schema dump or `SETUP_DATABASE.sql` + migrations |
