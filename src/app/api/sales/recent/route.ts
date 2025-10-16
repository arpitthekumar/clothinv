import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  
  // Get recent sales (last 10)
  const sales = await storage.getSales();
  const recentSales = sales
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10)
    .map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      items: sale.items
    }));
  
  return NextResponse.json(recentSales);
}
