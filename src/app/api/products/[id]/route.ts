import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertProductSchema } from "@shared/schema";
import { mapProductToDb, mapProductFromDb } from "@/lib/db-column-mapper";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const product = await storage.getProduct(params.id);
  if (!product) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(mapProductFromDb(product));
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    
    // Clean up buyingPrice: remove it if empty, otherwise keep the value
    if (body.buyingPrice !== undefined) {
      if (body.buyingPrice === "" || body.buyingPrice === null) {
        // Remove the property instead of setting to null to avoid validation issues
        delete body.buyingPrice;
      }
    }
    
    // Clean up other optional fields
    if (body.description === "") body.description = null;
    if (body.size === "") body.size = null;
    if (body.barcode === "") body.barcode = null;
    if (body.categoryId === "") body.categoryId = null;
    
    const data = insertProductSchema.partial().parse(body);

    // Validate price relationships against existing values
    const existing = await storage.getProduct(params.id);
    const buyingPriceVal = data.buyingPrice !== undefined 
      ? data.buyingPrice 
      : (existing ? (existing as any).buyingPrice ?? (existing as any).buying_price : null);
    const sellingPriceVal = data.price !== undefined 
      ? data.price 
      : (existing ? (existing as any).price : null);
    const minPriceVal = data.minPrice !== undefined 
      ? data.minPrice 
      : (existing ? (existing as any).minPrice ?? (existing as any).min_price : null);

    const buying = buyingPriceVal != null ? Number(buyingPriceVal) : null;
    const selling = sellingPriceVal != null ? Number(sellingPriceVal) : null;
    const minP = minPriceVal != null ? Number(minPriceVal) : null;

    if (buying != null && !isNaN(buying) && buying > 0) {
      if (selling != null && !isNaN(selling) && selling < buying) {
        return NextResponse.json(
          { error: `Selling price (₹${selling}) cannot be lower than buying price (₹${buying})` },
          { status: 400 }
        );
      }
      if (minP != null && !isNaN(minP) && minP < buying) {
        return NextResponse.json(
          { error: `Minimum price (₹${minP}) cannot be lower than buying price (₹${buying})` },
          { status: 400 }
        );
      }
    }

    if (minP != null && !isNaN(minP) && selling != null && !isNaN(selling) && selling < minP) {
      return NextResponse.json(
        { error: `Selling price (₹${selling}) cannot be lower than minimum price (₹${minP})` },
        { status: 400 }
      );
    }
    
    // Map all fields to database column names (snake_case for Supabase)
    const dbData = mapProductToDb(data);
    
    // Log what we're sending for debugging
    console.log("Updating product with data:", JSON.stringify(dbData, null, 2));
    
    const product = await storage.updateProduct(params.id, dbData);
    if (!product) return NextResponse.json({}, { status: 404 });
    return NextResponse.json(mapProductFromDb(product));
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    const errorMessage = error.message || "Invalid product data";
    
    // Provide helpful error message for schema issues
    if (error.code === 'PGRST204') {
      return NextResponse.json(
        { 
          error: "Database schema mismatch. Please run the migration script 'fix-product-columns.sql' in your Supabase SQL editor to fix column names.",
          details: errorMessage
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  const salesCount = await storage.getProductSalesCount(params.id);
  if (salesCount > 0) {
    const recentSales = await storage.getProductRecentSales(params.id, 6);
    return NextResponse.json(
      {
        error: `Cannot permanently delete product: this item is connected to ${salesCount} sales transaction${salesCount > 1 ? "s" : ""}. To protect historical invoice and audit records, keep it in trash instead.`,
        code: "HAS_LINKED_SALES",
        salesCount,
        linkedInvoices: recentSales,
      },
      { status: 409 }
    );
  }

  const ok = await storage.deleteProduct(params.id);
  if (!ok) return NextResponse.json({}, { status: 404 });
  return NextResponse.json({}, { status: 204 });
}

// export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
//   const params = await context.params;
//   const auth = await requireAuth();
//   if (!auth.ok) return NextResponse.json({}, { status: 401 });
//   if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

//   const { pathname } = new URL(req.url);
//   if (pathname.endsWith('/restore')) {
//     const ok = await storage.restoreProduct(params.id);
//     if (!ok) return NextResponse.json({ error: "Failed to restore product" }, { status: 500 });
//     return NextResponse.json({ message: "Product restored successfully" });
//   }

//   return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
// }


