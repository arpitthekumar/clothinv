import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertPurchaseOrderItemSchema, insertPurchaseOrderSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const pos = await storage.getPurchaseOrders();
  return NextResponse.json(pos);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const data = insertPurchaseOrderSchema.parse(body);
    const created = await storage.createPurchaseOrder(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    // Add a PO item
    const item = insertPurchaseOrderItemSchema.parse(body);
    const created = await storage.addPurchaseOrderItem(item);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}


