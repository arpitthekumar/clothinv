import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  const sid = req.cookies.get("clothinv.sid");
  if (!sid && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/inventory", "/pos", "/reports", "/scan", "/settings", "/admin/:path*"],
};


