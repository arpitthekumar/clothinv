"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import ReportControls from "@/components/reports/ReportControls";
import ReportSummary from "@/components/reports/ReportSummary";
import KPIWidgets from "@/components/reports/KPIWidgets";
import NotSellingTable from "@/components/reports/NotSellingTable";
import SalesTable from "@/components/reports/SalesTable";
import { normalizeItems } from "@/lib/json";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { Sale } from "@shared/schema";
import AnalyticsCharts from "../reports/AnalyticsCharts";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date } | null>(null);
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Calculate date range based on selection
  const dateRangeParams = useMemo(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = endOfDay(now);

    if (dateRange === "custom" && customDateRange?.from && customDateRange?.to) {
      fromDate = startOfDay(customDateRange.from);
      toDate = endOfDay(customDateRange.to);
    } else {
      switch (dateRange) {
        case "today":
          fromDate = startOfDay(now);
          toDate = endOfDay(now);
          break;
        case "week":
          fromDate = startOfDay(subDays(now, 7));
          toDate = endOfDay(now);
          break;
        case "month":
          fromDate = startOfDay(subDays(now, 30));
          toDate = endOfDay(now);
          break;
        case "all":
          fromDate = new Date(0); // Beginning of time
          toDate = endOfDay(now);
          break;
        default:
          fromDate = startOfDay(subDays(now, 30));
          toDate = endOfDay(now);
      }
    }

    // Calculate sinceDays for backward compatibility (days from now)
    const daysDiff = Math.ceil((now.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const sinceDays = daysDiff > 36500 ? 36500 : daysDiff;

    return {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      sinceDays,
    };
  }, [dateRange, customDateRange]);

  const salesWindowDays = reportType === "monthly" ? 30 : 7;

  const analyticsQuery = useQuery({
    queryKey: [
      "/api/reports/analytics",
      {
        sinceDays: dateRangeParams.sinceDays,
        salesWindowDays,
        fromDate: dateRangeParams.fromDate,
        toDate: dateRangeParams.toDate,
      },
    ],
  });
  const stockValuationQuery = useQuery({
    queryKey: ["/api/reports/stock-valuation"],
  });
  const stockValuation = stockValuationQuery.data || ({} as any);

  const analytics = analyticsQuery.data || ({} as any);

  // Sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const { fromDate, toDate } = dateRangeParams;
    const from = new Date(fromDate);
    const to = new Date(toDate);

    return sales.filter((sale: any) => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at);
      return saleDate >= from && saleDate <= to;
    });
  }, [sales, dateRangeParams]);

  // Summary Calculations
  const totalSales = filteredSales.reduce(
    (sum: number, sale: any) => sum + parseFloat(sale.total_amount || "0"),
    0
  );
  const totalTransactions = filteredSales.length;
  const averageTicket =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Export CSV
  const handleExportReport = () => {
    if (!sales.length) return alert("No sales data available.");
    const csv = generateCSV(sales);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportType}-${dateRange}.csv`;
    a.click();
  };

  const generateCSV = (data: Sale[]) => {
    const headers = ["Invoice", "Date", "Total", "Items", "Payment"];
    const rows = data.map((s: any) => {
      const items = normalizeItems(s.items);
      return [
        s.invoice_number,
        new Date(s.created_at).toLocaleString(),
        s.total_amount,
        items.length,
        s.payment_method,
      ];
    });
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Reports & Analytics"
          subtitle="View sales performance and generate reports"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <ReportControls
            reportType={reportType}
            dateRange={dateRange}
            setReportType={setReportType}
            setDateRange={setDateRange}
            onExport={handleExportReport}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
          />

          <ReportSummary
            totalSales={totalSales}
            totalTransactions={totalTransactions}
            averageTicket={averageTicket}
          />

          <KPIWidgets
            profit={Number(analytics.totalProfit || 0)}
            valuation={Number(stockValuation.totalValuation || 0)}
            totalCost={Number(stockValuation.totalCost || 0)}
            notSellingCount={Number(analytics.notSellingCount || 0)}
            dateRange={dateRange}
            customDateRange={customDateRange}
          />

          <AnalyticsCharts
            salesData={analytics.salesData}
            categoryData={analytics.categoryData}
            topProducts={analytics.topProducts}
            profitData={analytics.profitData}
          />

          <NotSellingTable
            products={analytics.notSelling || []}
            dateRange={dateRange}
            customDateRange={customDateRange}
          />

          <SalesTable
            sales={filteredSales}
            loading={isLoading}
            products={products}
          />
        </main>
      </div>
    </div>
  );
}
