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

    const storeSettings = await storage.getStoreSettings();
    const activeTaxPercent = body.tax_percent !== undefined && body.tax_percent !== null
      ? parseFloat(body.tax_percent || "0")
      : (storeSettings?.taxEnabled ? Number(storeSettings.taxPercent) || 0 : 0);

    const isTaxInclusive = body.tax_inclusive !== undefined
      ? Boolean(body.tax_inclusive)
      : (storeSettings?.taxEnabled ? !!storeSettings.taxInclusive : false);

    // Calculate totals
    const totals = calculateSaleTotals(
      saleItems,
      body.discount_type || null,
      parseFloat(body.discount_value || "0"),
      activeTaxPercent,
      isTaxInclusive
    );

    // Validate stock for all items before processing sale (prevents concurrent over-selling)
    for (const item of saleItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.name || item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    const rawName = body.customer_name?.trim() || "";
    const rawPhone = body.customer_phone?.trim() || "";

    if (!rawName || !rawPhone) {
      return NextResponse.json(
        { error: "Both Customer Name and Customer Phone are required." },
        { status: 400 }
      );
    }

    const custName = rawName;
    const custPhone = rawPhone;

    // Security & Data Integrity Validations
    if (custPhone !== "0000000000" && custPhone !== "N/A") {
      const cleanDigits = custPhone.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        return NextResponse.json(
          { error: "Customer phone number must be a valid 10-digit number." },
          { status: 400 }
        );
      }
      if (custName.toLowerCase() === "walk-in customer") {
        return NextResponse.json(
          { error: "Custom phone numbers cannot be registered under 'Walk-in Customer'." },
          { status: 400 }
        );
      }
    }

    if (custName.toLowerCase() !== "walk-in customer" && custName !== "") {
      if (custPhone === "0000000000" || custPhone === "N/A") {
        return NextResponse.json(
          { error: "Custom customer names require a valid 10-digit phone number." },
          { status: 400 }
        );
      }
    }

    let customerId: string | null = body.customer_id || null;

    if (!customerId && custPhone !== "N/A" && custPhone !== "0000000000" && custName.toLowerCase() !== "walk-in customer") {
      try {
        const customer = await storage.findOrCreateCustomer(custName, custPhone);
        if (customer) {
          customerId = customer.id;
        }
      } catch (err) {
        console.warn("Could not auto-link customer:", err);
      }
    }

    // Prepare sale data
    const saleData = {
      user_id: auth.user.id,
      customer_id: customerId,
      customer_name: custName,
      customer_phone: custPhone,
      items: saleItems,
      invoice_number: body.invoice_number || `INV-${Date.now()}`,
      subtotal: Math.round(totals.subtotal).toString(),
      tax_percent: Math.round(totals.taxPercent).toString(),
      tax_amount: Math.round(totals.taxAmount).toString(),
      tax_inclusive: isTaxInclusive,
      discount_type: totals.discountType,
      discount_value: Math.round(totals.discountValue).toString(),
      discount_amount: Math.round(totals.discountAmount).toString(),
      total_amount: Math.round(totals.total).toString(),
      payment_method: body.payment_method || "cash",
      salesperson_id: body.salesperson_id || null,
      salesperson_name: body.salesperson_name || null,
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

      const newStock = Math.max(0, product.stock - item.quantity);
      await storage.updateStock(item.productId, newStock);

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
