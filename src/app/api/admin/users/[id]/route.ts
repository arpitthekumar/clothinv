import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";
import { isSuperAdminUser } from "@server/super-admin";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "superadmin") return NextResponse.json({}, { status: 403 });

  const targetUser = await storage.getUser(id);
  if (!targetUser) return NextResponse.json({}, { status: 404 });

  const isRequesterSuperAdmin = isSuperAdminUser(auth.user);
  const isTargetSuperAdmin = isSuperAdminUser(targetUser);

  // Non-super-admin cannot edit a Super Admin user
  if (isTargetSuperAdmin && !isRequesterSuperAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only Super Admin can edit Super Admin accounts" },
      { status: 403 }
    );
  }

  const body = await req.json();

  // Reserved username/name check
  const reservedWords = ["admin", "administrator"];
  const uName = body.username?.trim().toLowerCase();
  const fName = (body.fullName || body.name || "").trim().toLowerCase();

  if (
    (uName && reservedWords.includes(uName) && targetUser.username?.trim().toLowerCase() !== "admin") ||
    (fName && reservedWords.includes(fName) && targetUser.fullName?.trim().toLowerCase() !== "admin")
  ) {
    return NextResponse.json(
      { error: "The name or username 'admin' is reserved and cannot be assigned." },
      { status: 400 }
    );
  }

  // Non-super-admin cannot promote a user to superadmin or set username to admin
  if (
    (body.role === "superadmin" || (body.username && body.username.trim().toLowerCase() === "admin")) &&
    !isRequesterSuperAdmin
  ) {
    return NextResponse.json(
      { error: "Forbidden: Only Super Admin can assign Super Admin role" },
      { status: 403 }
    );
  }

  const user = await storage.updateUser(id, body);
  if (!user) return NextResponse.json({}, { status: 404 });

  // If password was changed, revoke all existing sessions for this user for security
  if (body.password) {
    await storage.revokeAllUserSessions(id, "Password changed by administrator");
  }

  return NextResponse.json(user);

}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin" && auth.user.role !== "superadmin") return NextResponse.json({}, { status: 403 });

  const targetUser = await storage.getUser(id);
  if (!targetUser) return NextResponse.json({}, { status: 404 });

  const isRequesterSuperAdmin = isSuperAdminUser(auth.user);
  const isTargetSuperAdmin = isSuperAdminUser(targetUser);

  // Non-super-admin cannot delete a Super Admin user
  if (isTargetSuperAdmin && !isRequesterSuperAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only Super Admin can delete Super Admin accounts" },
      { status: 403 }
    );
  }

  const salesCount = await storage.getUserSalesCount(id);
  if (salesCount > 0) {
    const recentSales = await storage.getUserRecentSales(id, 6);
    return NextResponse.json(
      {
        error: `Cannot delete user: this user recorded ${salesCount} sales transaction${salesCount > 1 ? "s" : ""}. To protect sales audit history, change their password or role instead.`,
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

  const ok = await storage.deleteUser(id);
  if (!ok) return NextResponse.json({}, { status: 404 });

  // ✅ Fix invalid 204 response
  return new NextResponse(null, { status: 204 });
}
