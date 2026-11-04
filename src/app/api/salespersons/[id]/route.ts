import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = auth.user.role;
  const username = auth.user.username?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || username === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only admins and superadmins can edit salespersons" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Salesperson ID required" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await storage.updateSalesperson(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Salesperson not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update salesperson" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = auth.user.role;
  const username = auth.user.username?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || username === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only admins and superadmins can delete salespersons" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Salesperson ID required" }, { status: 400 });
    }

    const salesCount = await storage.getSalespersonSalesCount(id);
    if (salesCount > 0) {
      const recentSales = await storage.getSalespersonRecentSales(id, 6);
      return NextResponse.json(
        {
          error: `Cannot delete salesperson: this staff member is linked to ${salesCount} sales transaction${salesCount > 1 ? "s" : ""}. To protect historical audit and reports, deactivate them instead.`,
          code: "HAS_LINKED_SALES",
          salesCount,
          linkedInvoices: recentSales.map((s) => ({
            id: s.id,
            invoiceNumber: s.invoice_number,
            amount: s.total_amount,
            customerName: s.customer_name,
            createdAt: s.created_at,
          })),
        },
        { status: 409 }
      );
    }

    await storage.deleteSalesperson(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete salesperson" },
      { status: 400 }
    );
  }
}
