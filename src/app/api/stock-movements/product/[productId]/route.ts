import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";

export async function GET(_req: Request, context: { params: Promise<{ productId: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const movements = await storage.getStockMovementsByProduct(params.productId);
  return NextResponse.json(movements);
}


