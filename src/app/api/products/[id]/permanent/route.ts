import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params;

  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can permanently delete products" },
      { status: 403 }
    );
  }

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
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

    const salesCount = await storage.getProductSalesCount(productId);
    if (salesCount > 0) {
      const recentSales = await storage.getProductRecentSales(productId, 6);
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
