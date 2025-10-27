import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertSaleSchema } from "@shared/schema";
import { calculateSaleTotals } from "@/lib/sales";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";

  const sales =
    auth.user.role === "admin"
      ? await storage.getSales(includeDeleted)
      : await storage.getSalesByUser(auth.user.id, includeDeleted);

  return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await request.json();
    const saleItems = Array.isArray(body.items)
      ? body.items
      : JSON.parse(body.items);

    // Calculate totals
    const totals = calculateSaleTotals(
      saleItems,
      body.discount_type || null,
      parseFloat(body.discount_value || "0")
    );

    // Prepare sale data
    const saleData = {
      user_id: auth.user.id,
      customer_name: body.customer_name || "Walk-in Customer",
      customer_phone: body.customer_phone || "N/A",
      items: saleItems,
      invoice_number: body.invoice_number || `INV-${Date.now()}`,
      subtotal: totals.subtotal.toFixed(2),
      tax_percent: totals.taxPercent.toFixed(2),
      tax_amount: totals.taxAmount.toFixed(2),
      discount_type: totals.discountType,
      discount_value: totals.discountValue.toFixed(2),
      discount_amount: totals.discountAmount.toFixed(2),
      total_amount: totals.total.toFixed(2),
      payment_method: body.payment_method || "cash",
    };

    // Validate schema
    const data = insertSaleSchema.parse(saleData);

    // Create sale in DB
    const sale = await storage.createSale(data);

    const items = Array.isArray(data.items)
      ? data.items
      : JSON.parse(data.items as any);

    // Create sale items and update stock
    await storage.createSaleItems(sale.id, items);

    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;

      await storage.updateStock(item.productId, product.stock - item.quantity);

      await storage.createStockMovement({
        productId: item.productId,
        userId: auth.user.id,
        type: "sale_out",
        quantity: -item.quantity,
        reason: `Sale ${sale.invoice_number}`,
        refTable: "sale_items",
        refId: sale.id,
      } as any);
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Sale creation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to create sale",
        details: error.details || error.hint || "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const saleId = pathParts[pathParts.length - 1];

    if (!saleId) {
      return NextResponse.json(
        { error: "Sale ID is required" },
        { status: 400 }
      );
    }

    await storage.softDeleteSale(saleId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete sale" },
      { status: 400 }
    );
  }
}
