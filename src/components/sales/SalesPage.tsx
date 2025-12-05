"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

import { normalizeItems } from "@/lib/json";
import { ThankYouModal } from "@/components/pos/ThankYouModal";
import { useAuth } from "@/hooks/use-auth";
import { useSales } from "./useSales";
import DateRangePicker from "@/components/reports/DateRangePicker";

import SalesSearchBar from "./SalesSearchBar";
import SalesList from "./SalesList";
import ReturnModal from "./ReturnModal";
import RequireAuth from "@/app/_components/require-auth";
import { queryClient } from "@/lib/queryClient";

export default function SalesPage() {
  // ------------------------ STATE ------------------------
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [limit, setLimit] = useState<number>(20);
  const [payment, setPayment] = useState<string>("");
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

  const { user } = useAuth();
  const isSystemAdmin = user?.role === "admin";
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
      searchBy,             // ← add this
      payment,
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
      date: new Date(sale.created_at),

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

      subtotal: sale.total_amount,
      tax: 0,
      total: sale.total_amount,
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name || "Walk-in Customer",
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
              handleDelete={(id: string) => deleteSale.mutate(id)}
              handleRestore={(id: string) => restoreSale.mutate(id)}
              handlePermanentDelete={(id: string) =>
                permanentDelete.mutate(id)
              }
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
      />
    </RequireAuth>
  );
}