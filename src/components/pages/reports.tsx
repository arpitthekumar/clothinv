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
import { AlertTriangle, Loader2, Calculator } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Widgets Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 border rounded-xl bg-card space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-5 w-5 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 border rounded-xl bg-card space-y-3">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Payment Breakdown Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2 bg-muted/10">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-6 flex-1 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-6 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState("today");
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  } | null>(null);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
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

  const audit = analytics.calculationAudit || {
    grossSales: 0,
    taxAmount: 0,
    netRevenue: 0,
    costOfSales: 0,
    netProfit: 0,
    profitMarginPercent: 0,
  };

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
            onAuditClick={() => setShowAuditModal(true)}
            isLoading={analyticsQuery.isFetching || analyticsQuery.isLoading}
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

          {analyticsQuery.isLoading || stockValuationQuery.isLoading ? (
            <ReportsSkeleton />
          ) : (
            <>
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
            </>
          )}
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

      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Calculation Audit Breakdown
            </DialogTitle>
            <DialogDescription>
              Detailed accounting formula for the selected date range: <strong>{dateRangeLabel}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 my-4">
            <div className="bg-muted/50 rounded-xl p-4 border space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Gross Sales Revenue (A)</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    ₹{audit.grossSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Less: Sales Tax Collected (B)</span>
                  <span className="font-semibold tabular-nums text-red-500">
                    - ₹{audit.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-foreground">Net Sales Revenue (C = A - B)</span>
                  <span className="font-bold tabular-nums text-foreground">
                    ₹{audit.netRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Less: Cost of Goods Sold / COGS (D)</span>
                  <span className="font-semibold tabular-nums text-red-500">
                    - ₹{audit.costOfSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-semibold pt-1">
                  <span className="text-primary font-bold">Net Margin / Profit (E = C - D)</span>
                  <span className="font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 text-lg">
                    ₹{audit.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Calculated Net Profit Margin
                </p>
                <p className="text-xs text-muted-foreground">
                  Formula: (Net Margin E / Net Revenue C) × 100
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {audit.profitMarginPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/30 p-3 rounded-lg">
              <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                ℹ️ Audit Integrity Notice:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Gross sales totals are summed directly from client-paid invoice amounts.</li>
                <li>Product costs are calculated dynamically using the current unit buying price.</li>
                <li>Tax amounts are excluded from profit margins to reflect true operational net income.</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full sm:w-auto">Close Audit</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
