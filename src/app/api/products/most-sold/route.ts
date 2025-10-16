import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  
  // Get all sales to calculate most sold products
  const sales = await storage.getSales();
  const productSales: { [productId: string]: { product: any; totalSold: number; name: string; sku: string; price: string } } = {};
  
  // Process all sales to count product sales
  for (const sale of sales) {
    const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (productSales[item.productId]) {
          productSales[item.productId].totalSold += item.quantity;
        } else {
          productSales[item.productId] = {
            product: null,
            totalSold: item.quantity,
            name: item.name,
            sku: item.sku,
            price: item.price
          };
        }
      }
    }
  }
  
  // Convert to array and sort by total sold
  const mostSold = Object.entries(productSales)
    .map(([productId, data]) => ({
      productId,
      name: data.name,
      sku: data.sku,
      price: data.price,
      totalSold: data.totalSold
    }))
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10); // Top 10 most sold
  
  return NextResponse.json(mostSold);
}

