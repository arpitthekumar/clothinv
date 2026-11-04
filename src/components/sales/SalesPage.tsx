"use client";
import { parseDateSafe } from "@/lib/date-utils";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

import { normalizeItems } from "@/lib/json";
import { ThankYouModal } from "@/components/pos/ThankYouModal";
import { useAuth } from "@/hooks/use-auth";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useSales } from "./useSales";
import DateRangePicker from "@/components/reports/DateRangePicker";

import SalesSearchBar from "./SalesSearchBar";
import SalesList from "./SalesList";
import ReturnModal from "./ReturnModal";
import RequireAuth from "@/app/_components/require-auth";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  AlertTriangle,
  ShieldAlert,
  XCircle,
  Package,
  User,
  Receipt,
  CreditCard,
} from "lucide-react";

export default function SalesPage() {
  const { settings: storeSettings } = useStoreSettings();
  // ------------------------ STATE ------------------------
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [limit, setLimit] = useState<number>(20);
  const [payment, setPayment] = useState<string>("");
  const [salesperson, setSalesperson] = useState<string>("");
  const [productId, setProductId] = useState<string>("");

  // 🔥 ONLY USE THESE FOR DATE (REMOVE old start/end)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState("");

  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchBy, setSearchBy] = useState("all");

  const [saleToSoftDelete, setSaleToSoftDelete] = useState<any | null>(null);
  const [saleToPermanentDelete, setSaleToPermanentDelete] = useState<any | null>(null);

  const { user } = useAuth();
  const isSystemAdmin = user?.role === "admin";

  const { data: salespersons = [] } = useQuery<any[]>({
    queryKey: ["/api/salespersons"],
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);
  useEffect(() => {
    if (!dateRange) {
      setStartDate("");
      setEndDate("");
      refresh(true);
      return;
    }

    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = new Date();

    switch (dateRange) {

      case "today":
        from = new Date();
        from.setHours(0, 0, 0, 0);
        break;

      case "yesterday":
        from = new Date(now);
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);

        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;

      case "7days":
        from = new Date();
        from.setDate(from.getDate() - 7);
        break;

      case "month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    if (from) {
      setStartDate(from.toISOString());
      setEndDate(to.toISOString());
      refresh(true);
    }
  }, [dateRange]);


  // ------------------------ QUERY ------------------------
  const { salesQuery, deleteSale, restoreSale, permanentDelete, returnSale } =
    useSales({
      limit,
      deleted: showTrash,
      search: searchTerm,
      searchBy,
      payment,
      salesperson,
      product: productId,
      start: startDate,
      end: endDate,
    });

  // Refresh helper
  function refresh(reset: boolean = false) {
    if (reset) {
      queryClient.removeQueries({ queryKey: ["/api/sales/load"] });
    }
    salesQuery.refetch();
  }

  // ------------------------ MERGED SALES ------------------------
  const allSales = useMemo(() => {
    const pages = salesQuery.data?.pages || [];
    const merged = pages.flatMap((p: any) => p?.data || []);

    const seen = new Set<string>();
    const unique: any[] = [];

    for (const s of merged) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        unique.push(s);
      }
    }
    return unique;
  }, [salesQuery.data]);

  const filteredSales = allSales;

  // ------------------------ INFINITE SCROLL ------------------------
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          salesQuery.hasNextPage &&
          !salesQuery.isFetchingNextPage
        ) {
          salesQuery.fetchNextPage();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [salesQuery.hasNextPage, salesQuery.isFetchingNextPage]);

  // ------------------------ RETURN LOGIC ------------------------
  function openReturnDialog(sale: any) {
    setSelectedSale(sale);

    const items = normalizeItems(sale.items).map((item: any) => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      maxQuantity: Number(item.quantity),
      quantity: 0,
    }));

    setReturnItems(items);
    setReturnModalOpen(true);
  }

  function updateReturnQty(productId: string, qty: number) {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, Math.min(qty, item.maxQuantity)) }
          : item
      )
    );
  }

  function submitReturn() {
    if (!selectedSale) return;

    const itemsToReturn = returnItems.filter((i) => i.quantity > 0);

    returnSale.mutate(
      {
        saleId: selectedSale.id,
        items: itemsToReturn.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          refundAmount: (i.price * i.quantity).toFixed(2),
        })),
      },
      {
        onSuccess: () => setReturnModalOpen(false),
      }
    );
  }

  // ------------------------ PRINT BILL ------------------------
  function handlePrint(sale: any) {
    const items = normalizeItems(sale.items);

    setInvoiceData({
      invoiceNumber: sale.invoice_number,
      date: parseDateSafe(sale.created_at),

      discount_amount: Number(sale.discount_amount) ?? 0,
      discount_value: Number(sale.discount_value) ?? 0,
      discount_type: sale.discount_type ?? null,

      items: items.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price),
        total: i.quantity * Number(i.price),
        discount_amount: Number(i.discount_amount) ?? 0,
        discount_value: Number(i.discount_value) ?? 0,
      })),

      subtotal: sale.subtotal ? Number(sale.subtotal) : Number(sale.total_amount || 0),
      tax: Number(sale.tax_amount || 0),
      taxPercent: Number(sale.tax_percent || 0),
      discountAmount: Number(sale.discount_amount || 0),
      total: Number(sale.total_amount || 0),
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name || "Walk-in Customer",
      salespersonName: sale.salesperson_name || sale.salespersonName || undefined,
      storeSettings: storeSettings ? {
        storeName: storeSettings.storeName,
        address: storeSettings.address,
        phone: storeSettings.phone,
        email: storeSettings.email,
        gstNumber: storeSettings.gstNumber,
        tagline: storeSettings.tagline,
        receiptFooter: storeSettings.receiptFooter,
        taxLabel: storeSettings.taxLabel,
        taxInclusive: storeSettings.taxInclusive,
        showSalespersonOnBill: storeSettings.showSalespersonOnBill,
        whatsappTemplate: storeSettings.whatsappTemplate,
        instagram: storeSettings.instagram,
        whatsappNumber: storeSettings.whatsappNumber,
      } : undefined,
    });



    setCustomerPhone(sale.customer_phone || "");
    setThankYouOpen(true);
  }

  // ------------------------ UI ------------------------
  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} />

        <div className="flex-1 flex flex-col">
          <Header
            title="Sales Management"
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="p-4 space-y-6 overflow-auto">
            {/* 🔍 Filters */}
            <SalesSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchBy={searchBy}
              setSearchBy={setSearchBy}
              showTrash={showTrash}
              setShowTrash={setShowTrash}
              limit={limit}
              setLimit={setLimit}
              payment={payment}
              setPayment={setPayment}
              salesperson={salesperson}
              setSalesperson={setSalesperson}
              salespersons={salespersons}
              productId={productId}
              setProductId={setProductId}
              startDate={startDate}
              endDate={endDate}
              onOpenDatePicker={() => setDatePickerOpen(true)}
              refresh={refresh}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            {/* 📅 Date Picker Modal */}
            <DateRangePicker
              open={datePickerOpen}
              onOpenChange={setDatePickerOpen}
              currentRange={{
                from: startDate ? new Date(startDate) : undefined,
                to: endDate ? new Date(endDate) : undefined,
              }}
              onDateRangeChange={(range) => {
                if (!range) {
                  setStartDate("");
                  setEndDate("");
                } else {
                  setStartDate(range.from?.toISOString() || "");
                  setEndDate(range.to?.toISOString() || "");
                }
                refresh(true);
              }}
            />

            {/* 🧾 Sales List */}
            <SalesList
              isLoading={salesQuery.isLoading}
              salesQuery={salesQuery}
              handleDelete={(saleOrId: any) => {
                const saleObj =
                  typeof saleOrId === "object" && saleOrId !== null
                    ? saleOrId
                    : allSales.find((s) => s.id === saleOrId) || { id: saleOrId };
                setSaleToSoftDelete(saleObj);
              }}
              handleRestore={(id: string) => restoreSale.mutate(id)}
              handlePermanentDelete={(saleOrId: any) => {
                const saleObj =
                  typeof saleOrId === "object" && saleOrId !== null
                    ? saleOrId
                    : allSales.find((s) => s.id === saleOrId) || { id: saleOrId };
                setSaleToPermanentDelete(saleObj);
              }}
              handleReturnSale={openReturnDialog}
              handlePrintSale={handlePrint}
              isSystemAdmin={isSystemAdmin}
            />

            {/* Infinite scroll loader */}
            <div ref={loadMoreRef} className="h-6" />
          </main>
        </div>
      </div>

      {/* Return Modal */}
      <ReturnModal
        open={returnModalOpen}
        setOpen={setReturnModalOpen}
        items={returnItems}
        selectedSale={selectedSale}
        onUpdateQty={updateReturnQty}
        onSubmit={submitReturn}
        isSubmitting={returnSale.isPending}
      />

      {/* Print Modal */}
      <ThankYouModal
        open={thankYouOpen}
        onOpenChange={setThankYouOpen}
        invoiceData={invoiceData}
        customerPhone={customerPhone}
        disableAutomation
      />

      {/* 🗑️ Move Sale to Trash Confirmation Modal */}
      <Dialog
        open={!!saleToSoftDelete}
        onOpenChange={(open) => !open && setSaleToSoftDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Move Sale to Trash?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Confirm moving this invoice to the trash bin
            </DialogDescription>
          </DialogHeader>

          {saleToSoftDelete && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 bg-muted/60 border rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">Invoice Number</span>
                  <span className="font-mono font-bold text-foreground">
                    {saleToSoftDelete.invoice_number || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Customer
                  </span>
                  <span className="font-medium text-foreground">
                    {saleToSoftDelete.customer_name || "Walk-in Customer"}
                    {saleToSoftDelete.customer_phone &&
                    saleToSoftDelete.customer_phone !== "N/A" &&
                    saleToSoftDelete.customer_phone !== "0000000000"
                      ? ` (${saleToSoftDelete.customer_phone})`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Receipt className="h-3.5 w-3.5" /> Total Amount
                  </span>
                  <span className="font-bold text-base text-foreground">
                    ₹{Number(saleToSoftDelete.total_amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" /> Payment Method
                  </span>
                  <span className="font-medium capitalize text-foreground">
                    {saleToSoftDelete.payment_method || "cash"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                This sale will be moved to the Trash and excluded from active sales reports. You can review and restore it from the <strong>Trash</strong> view anytime.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaleToSoftDelete(null)}
              disabled={deleteSale.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (saleToSoftDelete) {
                  deleteSale.mutate(saleToSoftDelete.id, {
                    onSettled: () => setSaleToSoftDelete(null),
                  });
                }
              }}
              disabled={deleteSale.isPending}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {deleteSale.isPending ? "Moving to Trash..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ⚠️ Permanent Delete Confirmation Modal */}
      <Dialog
        open={!!saleToPermanentDelete}
        onOpenChange={(open) => !open && setSaleToPermanentDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-destructive">
                  Permanently Delete Sale?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Irreversible database deletion
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {saleToPermanentDelete && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-1.5 text-destructive dark:text-red-300">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Warning: Action Cannot Be Undone!
                </p>
                <p className="leading-relaxed opacity-90">
                  You are about to permanently delete invoice{" "}
                  <strong>#{saleToPermanentDelete.invoice_number || saleToPermanentDelete.id}</strong> (₹
                  {Number(saleToPermanentDelete.total_amount || 0).toLocaleString("en-IN")}).
                </p>
                <p className="leading-relaxed opacity-90">
                  This will completely erase all line items, sales return links, and movement logs for this invoice from the database forever.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaleToPermanentDelete(null)}
              disabled={permanentDelete.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (saleToPermanentDelete) {
                  permanentDelete.mutate(saleToPermanentDelete.id, {
                    onSettled: () => setSaleToPermanentDelete(null),
                  });
                }
              }}
              disabled={permanentDelete.isPending}
              className="gap-1.5 bg-red-600 hover:bg-red-700 font-medium"
            >
              <XCircle className="h-4 w-4" />
              {permanentDelete.isPending
                ? "Deleting Permanently..."
                : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}