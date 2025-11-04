import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can permanently delete products" },
      { status: 403 }
    );
  }

  const productId = params.id;
  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    // First verify the product exists and is already in trash
    const product = await storage.getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.deleted) {
      return NextResponse.json(
        { error: "Product must be moved to trash before permanent deletion" },
        { status: 400 }
      );
    }

    // Permanently delete the product
    await storage.deleteProduct(productId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error permanently deleting product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
