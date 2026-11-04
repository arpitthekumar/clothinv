import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone");

  if (!phone || !phone.trim()) {
    return NextResponse.json({ customer: null });
  }

  try {
    const customer = await storage.getCustomerByPhone(phone.trim());
    return NextResponse.json({ customer: customer || null });
  } catch (error: any) {
    console.error("GET /api/customers/lookup error:", error);
    return NextResponse.json({ customer: null });
  }
}
