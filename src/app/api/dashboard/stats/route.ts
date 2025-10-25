import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  
  // Get only active (non-deleted) sales for stats
  const activeSales = await storage.getSales(false); // false = exclude deleted
  const todayActiveSales = await storage.getSalesToday();
  const todaySales = todayActiveSales
    .filter(s => !s.deleted) // Double check to exclude deleted sales
    .reduce((sum, s) => sum + parseFloat((s as any).total_amount || "0"), 0);
  
  const totalProducts = (await storage.getProducts()).length;
  const lowStockItems = (await storage.getProducts()).filter(p => p.stock <= (p.minStock || 5)).length;
  const activeEmployees = 0;
  
  return NextResponse.json({ todaySales, totalProducts, lowStockItems, activeEmployees });
}


