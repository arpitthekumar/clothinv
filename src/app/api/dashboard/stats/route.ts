import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  // Get sales stats
  const activeSales = await storage.getSales(false);
  const todayActiveSales = await storage.getSalesToday();
  const todaySales = todayActiveSales
    .filter((s) => !s.deleted)
    .reduce((sum, s) => sum + parseFloat((s as any).total_amount || "0"), 0);

  // Product stats
  const products = await storage.getProducts();
  const totalProducts = products.length;
  const lowStockItems = products.filter(
    (p) => p.stock <= (p.minStock || 5)
  ).length;

  // ✅ User stats (employees only)
  const users = await storage.getUsers(); // assuming you have this in storage.ts
  const employees = users.filter(
    (u) => u.role === "employee" || u.role === "employ"
  );
  const activeEmployees = employees.length;

  return NextResponse.json({
    todaySales,
    totalProducts,
    lowStockItems,
    activeEmployees,
  });
}
