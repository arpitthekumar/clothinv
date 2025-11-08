"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import ReportControls from "@/components/reports/ReportControls";
import ReportSummary from "@/components/reports/ReportSummary";
import KPIWidgets from "@/components/reports/KPIWidgets";
import NotSellingTable from "@/components/reports/NotSellingTable";
import SalesTable from "@/components/reports/SalesTable";
import { normalizeItems } from "@/lib/json";
import { startOfDay, endOfDay } from "date-fns";
import { Sale } from "@shared/schema";
import AnalyticsCharts from "../reports/AnalyticsCharts";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Map dateRange to numeric sinceDays for report APIs
  const mapDateRangeToDays = (range: string) => {
    switch (range) {
      case "today":
        return 1;
      case "week":
        return 7;
      case "month":
        return 30;
      case "all":
        return 36500; // effectively all time
      default:
        return 30;
    }
  };

  const sinceDays = mapDateRangeToDays(dateRange);
  const salesWindowDays = reportType === "monthly" ? 30 : 7;

  const analyticsQuery = useQuery({
    queryKey: ["/api/reports/analytics", { sinceDays, salesWindowDays }],
  });
  const stockValuationQuery = useQuery({
    queryKey: ["/api/reports/stock-valuation"],
  });
  const stockValuation = stockValuationQuery.data || ({} as any);

  const analytics = analyticsQuery.data || ({} as any);

  // Sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Filter sales by date range
  const filteredSales = sales?.filter((sale: any) => {
    if (!sale.created_at) return false;
    const saleDate = new Date(sale.created_at);
    const now = new Date();

    switch (dateRange) {
      case "today":
        return saleDate >= startOfDay(now) && saleDate <= endOfDay(now);
      case "week":
        return saleDate >= new Date(now.setDate(now.getDate() - 7));
      case "month":
        return saleDate >= new Date(now.setMonth(now.getMonth() - 1));
      default:
        return true;
    }
  });

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
          />

          <AnalyticsCharts
            salesData={analytics.salesData}
            categoryData={analytics.categoryData}
            topProducts={analytics.topProducts}
            profitData={analytics.profitData}
          />

          <NotSellingTable products={analytics.notSelling || []} />

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
