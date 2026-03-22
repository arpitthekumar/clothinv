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
  if (!user || user.role !== "admin") return false;

  if (process.env.NODE_ENV === "development" && user.id === "admin-dev-001") {
    return true;
  }

  const username = user.username?.trim().toLowerCase();
  const fullName = user.fullName?.trim().toLowerCase();
  return username === "admin" && fullName === "admin";
}
