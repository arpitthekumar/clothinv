import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";
import { mapProductFromDb } from "@/lib/db-column-mapper";

function formatDayShort(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatMonthShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const url = new URL(request.url);
  const sinceDays = parseInt(url.searchParams.get("sinceDays") || "30", 10);
  const salesWindow = parseInt(url.searchParams.get("salesWindowDays") || "7", 10);

  // Read-only: use storage to fetch required data
  const [sales, productsRaw, categories, profitMargins, stockValuation, notSelling] =
    await Promise.all([
      storage.getSales(false),
      storage.getProducts(),
      storage.getCategories(),
      storage.getProfitMargins({ sinceDays }),
      storage.getStockValuation(),
      storage.getNotSellingProducts({ sinceDays }),
    ]);

  const products = (productsRaw || []).map(mapProductFromDb);

  const now = new Date();

  // Sales over time (last salesWindow days)
  const salesStart = new Date(now);
  salesStart.setDate(now.getDate() - (salesWindow - 1));
  salesStart.setHours(0, 0, 0, 0);

  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < salesWindow; i++) {
    const d = new Date(salesStart);
    d.setDate(salesStart.getDate() + i);
    dayBuckets[d.toDateString()] = 0;
  }

  for (const s of sales || []) {
    if (!s.created_at) continue;
    const saleDate = new Date(s.created_at);
    if (saleDate < salesStart) continue;
    const key = saleDate.toDateString();
    const amt = parseFloat((s.total_amount as any) || "0");
    dayBuckets[key] = (dayBuckets[key] || 0) + amt;
  }

  const salesData = Object.keys(dayBuckets).map((k) => ({
    date: formatDayShort(new Date(k)),
    sales: Math.round((dayBuckets[k] + Number.EPSILON) * 100) / 100,
  }));

  // Category-wise sales
  const categoryMap: Record<string, { name: string; value: number }> = {};
  const productMap: Record<string, any> = {};
  for (const p of products || []) productMap[p.id] = p;
  const categoryNameMap: Record<string, string> = {};
  for (const c of categories || []) categoryNameMap[c.id] = c.name;

  for (const s of sales || []) {
    if (!s.items) continue;
    let items: any[] = [];
    try {
      items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || "[]");
    } catch (e) {
      continue;
    }
    // Recompute sale subtotal and discount distribution
    const recomputedSubtotal = (Array.isArray(items) ? items : []).reduce(
      (sum: number, it: any) => sum + Number(it.quantity || 0) * Number(it.price || 0),
      0
    );
    // Always prefer recorded discount amount from DB; if missing, treat as 0
    const discountAmount = Math.max(0, Number((s as any).discount_amount ?? 0) || 0);
    const discountRate = recomputedSubtotal > 0 ? Math.min(Math.max(discountAmount / recomputedSubtotal, 0), 1) : 0;
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const revenue = qty * price * (1 - discountRate);
      const prod = productMap[it.productId];
      const catId = prod?.categoryId;
      const catName = catId ? categoryNameMap[catId] || "Uncategorized" : "Uncategorized";
      if (!categoryMap[catName]) categoryMap[catName] = { name: catName, value: 0 };
      categoryMap[catName].value += revenue;
    }
  }

  const categoryData = Object.values(categoryMap)
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ name: c.name, value: Math.round((c.value + Number.EPSILON) * 100) / 100 }));

  // Top products by revenue
  const productRevenue: Record<string, { name: string; revenue: number }> = {};
  for (const s of sales || []) {
    if (!s.items) continue;
    let items: any[] = [];
    try {
      items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || "[]");
    } catch (e) {
      continue;
    }
    const recomputedSubtotal = (Array.isArray(items) ? items : []).reduce(
      (sum: number, it: any) => sum + Number(it.quantity || 0) * Number(it.price || 0),
      0
    );
    // Always prefer recorded discount amount from DB; if missing, treat as 0
    const discountAmount = Math.max(0, Number((s as any).discount_amount ?? 0) || 0);
    const discountRate = recomputedSubtotal > 0 ? Math.min(Math.max(discountAmount / recomputedSubtotal, 0), 1) : 0;
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      const revenue = qty * price * (1 - discountRate);
      const prod = productMap[it.productId];
      const name = prod?.name || it.name || "Unknown";
      if (!productRevenue[it.productId]) productRevenue[it.productId] = { name, revenue: 0 };
      productRevenue[it.productId].revenue += revenue;
    }
  }

  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({ name: p.name, sales: Math.round((p.revenue + Number.EPSILON) * 100) / 100 }));

  // Profit data (monthly buckets) — use profitMargins rpc result for totals if available
  const monthsBack = 4;
  const monthBuckets: Record<string, { profit: number; expense: number }> = {};
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets[key] = { profit: 0, expense: 0 };
  }

  let totalProfitCalc = 0;
  for (const s of sales || []) {
    if (!s.created_at || !s.items) continue;
    const saleDate = new Date(s.created_at);
    const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
    if (!monthBuckets[key]) continue;
    let items: any[] = [];
    try {
      items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || "[]");
    } catch (e) {
      continue;
    }

    let costSum = 0;
    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const prod = productMap[it.productId];
      const costPerUnit = prod ? Number(prod.buyingPrice ?? prod.price ?? 0) : 0;
      costSum += qty * costPerUnit;
    }

    // Compute revenue net of discounts (ignore tax)
    const recomputedSubtotal = (Array.isArray(items) ? items : []).reduce(
      (sum: number, it: any) => sum + Number(it.quantity || 0) * Number(it.price || 0),
      0
    );
    // Always prefer recorded discount amount from DB; if missing, treat as 0
    const discountAmount = Math.max(0, Number((s as any).discount_amount ?? 0) || 0);
    const saleRevenueNet = Math.max(0, recomputedSubtotal - discountAmount);
    const saleProfit = saleRevenueNet - costSum;

    monthBuckets[key].profit += saleProfit;
    monthBuckets[key].expense += costSum;
    totalProfitCalc += saleProfit;
  }

  const profitData = Object.keys(monthBuckets).map((k) => {
    const parts = k.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const d = new Date(year, month, 1);
    return {
      name: formatMonthShort(d),
      profit: Math.round((monthBuckets[k].profit + Number.EPSILON) * 100) / 100,
      expense: Math.round((monthBuckets[k].expense + Number.EPSILON) * 100) / 100,
    };
  });

  const totalProfitFromRpc =
    (profitMargins && (profitMargins as any).totalProfit !== undefined
      ? Number((profitMargins as any).totalProfit)
      : 0) || 0;
  const calculatedProfit = Number.isFinite(totalProfitCalc)
    ? totalProfitCalc
    : undefined;
  const totalProfit = calculatedProfit ?? totalProfitFromRpc;
  const totalValuation = (stockValuation && (stockValuation as any).totalValuation) || 0;
  const notSellingCount = Array.isArray(notSelling) ? notSelling.length : 0;

  return NextResponse.json({
    salesData,
    categoryData,
    topProducts,
    profitData,
    totalProfit,
    totalValuation,
    notSellingCount,
    notSelling: notSelling || [],
  });
}
