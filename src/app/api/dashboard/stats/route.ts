import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const stats = await storage.getSales();
  const todaySales = (await storage.getSalesToday()).reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
  const totalProducts = (await storage.getProducts()).length;
  const lowStockItems = (await storage.getProducts()).filter(p => p.stock <= (p.minStock || 5)).length;
  const activeEmployees = 0;
  return NextResponse.json({ todaySales, totalProducts, lowStockItems, activeEmployees });
}


