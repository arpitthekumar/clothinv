import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertSaleSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const sales = auth.user.role === "admin" ? await storage.getSales() : await storage.getSalesByUser(auth.user.id);
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    const saleData = {
      ...body,
      userId: auth.user.id,
      invoiceNumber: `INV-${Date.now()}`,
    };
    const data = insertSaleSchema.parse(saleData);
    const sale = await storage.createSale(data);

    const items = Array.isArray(data.items) ? data.items : JSON.parse((data as any).items);
    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        await storage.updateStock(item.productId, product.stock - item.quantity);
        await storage.createStockMovement({
          productId: item.productId,
          userId: auth.user.id,
          type: "out",
          quantity: -item.quantity,
          reason: `Sale ${sale.invoiceNumber}`,
        });
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid sale data" }, { status: 400 });
  }
}


