import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROFILE_COOKIE = "clothinv.supabase_profile";
const PROFILE_HEADER = "x-clothinv-supabase-profile";

export function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isApi = req.nextUrl.pathname.startsWith("/api");

  const requestHeaders = new Headers(req.headers);
  const raw = req.cookies.get(PROFILE_COOKIE)?.value;
  const profile = raw === "secondary" ? "secondary" : "primary";
  requestHeaders.set(PROFILE_HEADER, profile);

  const sid = req.cookies.get("clothinv.sid");
  const path = req.nextUrl.pathname;
  const skipAuthRedirect =
    isAuthPage ||
    isApi ||
    path.endsWith(".webmanifest") ||
    path === "/manifest" ||
    path.startsWith("/downloads/");

  if (!sid && !skipAuthRedirect) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Run on all app routes except Next internals and static assets so API + pages
     * receive x-clothinv-supabase-profile for database selection.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|apk)$).*)",
  ],
};
