import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

// POST: create a sales return and restock items
// Body: { saleId, customerId?, reason?, items: [{ productId, saleItemId?, quantity, refundAmount? }] }
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    console.log("Sales return request body:", JSON.stringify(body, null, 2));
    
    const saleId = body?.saleId;
    const items = Array.isArray(body?.items) ? body.items : [];
    
    console.log("SaleId:", saleId, "Items:", items);
    
    if (!saleId || items.length === 0) {
      return NextResponse.json({ error: "saleId and items are required" }, { status: 400 });
    }

    const result = await storage.createSalesReturn({
      saleId,
      customerId: body?.customerId,
      reason: body?.reason,
      items,
      userId: auth.user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Sales return error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create return",
      details: error.details || error.hint || "Unknown error"
    }, { status: 400 });
  }
}


