import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";
import { isSuperAdminUser } from "@server/super-admin";

export async function GET() {
  try {
    const settings = await storage.getStoreSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch billing settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const isSuperAdmin = isSuperAdminUser(auth.user);

    if (!isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "Access Denied: Only Super Admin can edit store and receipt settings." },
        { status: 403 }
      );
    }

    const updated = await storage.updateStoreSettings(body);
    return NextResponse.json({ ok: true, settings: updated, message: "Store billing settings updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update store billing settings" },
      { status: 500 }
    );
  }
}
