import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertProductSchema } from "@shared/schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  
  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
  
  const products = await storage.getProducts(includeDeleted);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const data = insertProductSchema.parse(await req.json());
    
    // Check if barcode is unique if provided
    if (data.barcode) {
      const existingProduct = await storage.getProductByBarcode(data.barcode);
      if (existingProduct && !existingProduct.deleted) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 400 });
      }
    }
    
    const product = await storage.createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("unique")) {
      return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await storage.softDeleteProduct(id);
    return NextResponse.json({ message: "Product moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}


