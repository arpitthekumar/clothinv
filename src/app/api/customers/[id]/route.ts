import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const data = await storage.getCustomerWithHistory(id);
    if (!data) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`GET /api/customers/${id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = auth.user.role;
  const username = auth.user.username?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || username === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only administrators can edit customer details" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await storage.updateCustomer(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PUT /api/customers/${id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = auth.user.role;
  const username = auth.user.username?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || username === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only administrators can delete or archive customer records" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const url = new URL(request.url);
  const isArchive = url.searchParams.get("archive") === "true" || url.searchParams.get("action") === "archive";
  const isRestore = url.searchParams.get("restore") === "true" || url.searchParams.get("action") === "restore";

  try {
    if (isRestore) {
      const restored = await storage.restoreCustomer(id);
      if (!restored) {
        return NextResponse.json({ error: "Failed to restore customer" }, { status: 400 });
      }
      return NextResponse.json({ success: true, restored: true, message: "Customer restored successfully" });
    }

    if (isArchive) {
      const archived = await storage.softDeleteCustomer(id);
      if (!archived) {
        return NextResponse.json({ error: "Failed to archive customer" }, { status: 400 });
      }
      return NextResponse.json({ success: true, archived: true, message: "Customer archived successfully" });
    }

    // Hard delete attempt - verify 0 connected transactions first
    const { salesCount, returnsCount } = await storage.getCustomerSalesCount(id);
    if (salesCount > 0 || returnsCount > 0) {
      const recentSales = await storage.getCustomerRecentSales(id, 6);
      return NextResponse.json(
        {
          error: `Cannot permanently delete customer: linked to ${salesCount} sales transaction${salesCount > 1 ? "s" : ""}${
            returnsCount > 0 ? ` and ${returnsCount} return record${returnsCount > 1 ? "s" : ""}` : ""
          }. To protect invoice and accounting records, archive them instead.`,
          code: "HAS_LINKED_SALES",
          salesCount,
          returnsCount,
          canArchive: true,
          linkedInvoices: recentSales.map((s) => ({
            id: s.id,
            invoiceNumber: s.invoice_number,
            amount: s.total_amount,
            createdAt: s.created_at,
          })),
        },
        { status: 409 }
      );
    }

    const success = await storage.deleteCustomer(id);
    if (!success) {
      return NextResponse.json({ error: "Customer not found or could not be deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: true, message: "Customer permanently deleted" });
  } catch (error: any) {
    console.error(`DELETE /api/customers/${id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete customer" }, { status: 500 });
  }
}
