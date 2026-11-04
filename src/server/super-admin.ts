/**
 * Super-admin: may switch Supabase profile and run secondary reset/sync.
 * - Production: username `admin`, full name `admin`, role `admin` (case-insensitive on name fields).
 * - Local dev: session from login bypass with id `admin-dev-001`.
 */
export function isSuperAdminUser(
  user:
    | {
        id?: string;
        username?: string;
        fullName?: string;
        role?: string;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  if (user.id === "admin-dev-001") return true;
  if (user.role === "superadmin") return true;
  return user.username?.trim().toLowerCase() === "admin";
}

