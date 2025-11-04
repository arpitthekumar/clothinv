import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can permanently delete sales" },
      { status: 403 }
    );
  }

  const { id: saleId } = await context.params;
  if (!saleId) {
    return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
  }

  try {
    // Get all sales to find the one we want to delete
    const sales = await storage.getSales(true); // include deleted
    const sale = sales.find(s => s.id === saleId);
    
    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    if (!sale.deleted) {
      return NextResponse.json(
        { error: "Sale must be moved to trash before permanent deletion" },
        { status: 400 }
      );
    }

  // Delete the sale permanently from storage
  await storage.deleteSale(saleId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error permanently deleting sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sale" },
      { status: 500 }
    );
  }
}