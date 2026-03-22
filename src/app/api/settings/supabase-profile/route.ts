import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireAuth } from "../../_lib/session";
import {
  getSecondarySupabaseUrl,
  isSecondarySupabaseConfigured,
} from "@server/supabase-env";

const COOKIE_NAME = "clothinv.supabase_profile";
const HEADER_PROFILE = "x-clothinv-supabase-profile";

function hostFromEnv(url?: string | null): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).host;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") {
    return NextResponse.json({}, { status: 403 });
  }

  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  const profile: "primary" | "secondary" =
    raw === "secondary" ? "secondary" : "primary";

  const primaryUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secondaryUrl = process.env.SUPABASE_URL_SECONDARY;
  const secondaryConfigured = Boolean(
    secondaryUrl?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY_SECONDARY?.trim() ||
        process.env.SUPABASE_ANON_KEY_SECONDARY?.trim())
  );

  return NextResponse.json({
    profile,
    primaryHost: hostFromEnv(primaryUrl),
    secondaryHost: hostFromEnv(secondaryUrl),
    secondaryConfigured,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") {
    return NextResponse.json({}, { status: 403 });
  }

  let body: { profile?: string };
  try {
    body = (await req.json()) as { profile?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profile: "primary" | "secondary" =
    body.profile === "secondary" ? "secondary" : "primary";

  if (profile === "secondary") {
    if (!isSecondarySupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Secondary Supabase is not configured. Set SUPABASE_URL_SECONDARY and SUPABASE_SERVICE_ROLE_KEY_SECONDARY (or ANON) in the environment.",
        },
        { status: 400 }
      );
    }
  }

  const res = NextResponse.json({ ok: true, profile });
  res.cookies.set(COOKIE_NAME, profile, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  res.headers.set(HEADER_PROFILE, profile);
  return res;
}
