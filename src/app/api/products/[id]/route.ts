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


