import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

// Body: { items: [{ purchaseOrderItemId, quantity }] }
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "No items to receive" }, { status: 400 });
    }
    await storage.receivePurchaseOrderItems({ items, userId: auth.user.id });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to receive" }, { status: 400 });
  }
}


