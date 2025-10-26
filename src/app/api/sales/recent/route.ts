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
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10)
    .map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoice_number,
      totalAmount: sale.total_amount,
      createdAt: sale.created_at,
      items: sale.items
    }));
  
  return NextResponse.json(recentSales);
}
