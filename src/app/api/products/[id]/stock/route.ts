import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const { quantity } = await req.json();
    if (typeof quantity !== "number") return NextResponse.json({ error: "Quantity must be a number" }, { status: 400 });

    const updated = await storage.updateStock(params.id, quantity);
    if (!updated) return NextResponse.json({}, { status: 404 });

    await storage.createStockMovement({
      productId: params.id,
      userId: auth.user.id,
      type: "adjustment",
      quantity,
      reason: "Stock update",
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid stock update" }, { status: 400 });
  }
}


