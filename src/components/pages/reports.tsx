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
import { aggregateSalesByPaymentMethod } from "@/lib/payment-breakdown";
import { getReportDateRangeLabel } from "@/lib/report-date-range";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Sale } from "@shared/schema";
import AnalyticsCharts from "../reports/AnalyticsCharts";
import PaymentMethodBreakdown from "@/components/reports/PaymentMethodBreakdown";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  } | null>(null);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingRange, setPendingRange] = useState<{
    type: "preset" | "custom";
    value: string;
    customRange?: { from?: Date; to?: Date } | null;
  } | null>(null);

  const handleDateRangeChange = (value: string) => {
    if (value === "all") {
      setPendingRange({ type: "preset", value });
      setShowWarningModal(true);
    } else {
      setDateRange(value);
      setCustomDateRange(null);
    }
  };

  const handleCustomDateRangeChange = (range: { from?: Date; to?: Date } | null) => {
    if (range?.from && range?.to) {
      const daysDiff = Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff >= 60) {
        setPendingRange({ type: "custom", value: "custom", customRange: range });
        setShowWarningModal(true);
        return;
      }
    }
    setCustomDateRange(range);
    if (range) {
      setDateRange("custom");
    }
  };

  const handleConfirmRange = () => {
    if (!pendingRange) return;
    setIsConfirming(true);
    if (pendingRange.type === "preset") {
      setDateRange(pendingRange.value);
      setCustomDateRange(null);
    } else if (pendingRange.type === "custom") {
      setCustomDateRange(pendingRange.customRange || null);
      setDateRange("custom");
    }
  };

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

  const allTimeRange = useMemo(() => {
    if (!sales || sales.length === 0) return null;
    const dates = sales
      .map((s: any) => s.created_at ? new Date(s.created_at).getTime() : 0)
      .filter((t) => t > 0);
    if (dates.length === 0) return null;
    return {
      from: new Date(Math.min(...dates)),
      to: new Date(Math.max(...dates)),
    };
  }, [sales]);

  // Calculate date range based on selection
  const dateRangeParams = useMemo(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = endOfDay(now);

    if (
      dateRange === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
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
    const daysDiff = Math.ceil(
      (now.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
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

  useEffect(() => {
    if (isConfirming && !analyticsQuery.isFetching) {
      setIsConfirming(false);
      setShowWarningModal(false);
      setPendingRange(null);
    }
  }, [analyticsQuery.isFetching, isConfirming]);

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

  const dateRangeLabel = useMemo(
    () => getReportDateRangeLabel(dateRange, customDateRange, allTimeRange),
    [dateRange, customDateRange, allTimeRange],
  );

  const paymentMethodTotals = useMemo(
    () => aggregateSalesByPaymentMethod(filteredSales),
    [filteredSales],
  );

  // Summary Calculations
  const totalSales = filteredSales.reduce(
    (sum: number, sale: any) => sum + parseFloat(sale.total_amount || "0"),
    0,
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
            setDateRange={handleDateRangeChange}
            onExport={handleExportReport}
            customDateRange={customDateRange}
            onCustomDateRangeChange={handleCustomDateRangeChange}
            allTimeRange={allTimeRange}
          />

          {(dateRangeParams.sinceDays >= 60 || dateRange === "all") && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">Large Date Range Selected</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                You are loading a large range of historical data ({dateRange === "all" ? "All time" : `${dateRangeParams.sinceDays} days`}). This might take a few seconds to retrieve and process.
              </AlertDescription>
            </Alert>
          )}

          <ReportSummary
            totalSales={totalSales}
            totalTransactions={totalTransactions}
            averageTicket={averageTicket}
          />

          <PaymentMethodBreakdown
            totals={paymentMethodTotals}
            dateRangeLabel={dateRangeLabel}
          />
          <SalesTable
            sales={filteredSales}
            loading={isLoading}
            products={products}
          />

          <div className="relative space-y-6">
            {analyticsQuery.isFetching && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 rounded-lg min-h-[300px]">
                <div className="flex items-center gap-3 bg-card p-4 rounded-xl shadow-lg border">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="font-medium text-sm">Loading analytics data...</span>
                </div>
              </div>
            )}

            <KPIWidgets
              profit={Number(analytics.totalProfit || 0)}
              valuation={Number(stockValuation.totalValuation || 0)}
              totalCost={Number(stockValuation.totalCost || 0)}
              totalSalesCost={Number(analytics.totalSalesCost || 0)}
              notSellingCount={Number(analytics.notSellingCount || 0)}
              dateRange={dateRange}
              customDateRange={customDateRange}
              allTimeRange={allTimeRange}
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
              allTimeRange={allTimeRange}
            />
          </div>
        </main>
      </div>

      <AlertDialog open={showWarningModal} onOpenChange={(open) => {
        if (!isConfirming) {
          setShowWarningModal(open);
          if (!open) setPendingRange(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Load Large Report Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRange?.type === "preset"
                ? "You are about to load the entire history of sales ('All Time')."
                : `You are about to load a large range of ${pendingRange?.customRange?.from && pendingRange?.customRange?.to ? Math.ceil((pendingRange.customRange.to.getTime() - pendingRange.customRange.from.getTime()) / (1000 * 60 * 60 * 24)) : "more than 60"} days of sales reports.`}
              {" This requires significant database queries, which could slow down the system and increase resource costs. Do you want to proceed?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRange();
              }}
              disabled={isConfirming}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Proceed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
