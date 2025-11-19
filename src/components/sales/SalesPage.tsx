"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

import { normalizeItems } from "@/lib/json";
import { ThankYouModal } from "@/components/pos/ThankYouModal";
import { useAuth } from "@/hooks/use-auth";
import { useSales } from "./useSales";

import SalesSearchBar from "./SalesSearchBar";
import SalesList from "./SalesList";
import ReturnModal from "./ReturnModal";
import RequireAuth from "@/app/_components/require-auth";

// ------------------------
// TYPES
// ------------------------
interface ReturnItem {
  productId: string;
  name: string;
  price: number;
  maxQuantity: number;
  quantity: number;
}

interface SaleType {
  id: string;
  invoice_number: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  items: any;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceDataType {
  invoiceNumber: string;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName: string;
}

// ------------------------
// PAGE COMPONENT
// ------------------------
export default function SalesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleType | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const [invoiceData, setInvoiceData] = useState<InvoiceDataType | null>(null);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");

  const { user } = useAuth();
  const isSystemAdmin = user?.role === "admin";

  const { salesQuery, deleteSale, restoreSale, permanentDelete, returnSale } =
    useSales();

  // ------------------------
  // FILTERED SALES
  // ------------------------
  const filteredSales =
    salesQuery.data?.filter((sale: SaleType) => {
      const matchTerm =
        sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.total_amount.toString().includes(searchTerm) ||
        sale.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchTerm &&
        (showTrash ? (sale as any).deleted : !(sale as any).deleted)
      );
    }) || [];

  // ------------------------
  // RETURN LOGIC
  // ------------------------
  function openReturnDialog(sale: SaleType) {
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
    setReturnItems((prev: ReturnItem[]) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(0, Math.min(qty, item.maxQuantity)),
            }
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

  // ------------------------
  // PRINT BILL
  // ------------------------
  function handlePrint(sale: SaleType) {
    const items = normalizeItems(sale.items);

    const invoiceFormatted: InvoiceDataType = {
      invoiceNumber: sale.invoice_number,
      date: new Date(sale.created_at),
      items: items.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        price: Number(i.price),
        total: i.quantity * Number(i.price),
      })),
      subtotal: sale.total_amount,
      tax: 0,
      total: sale.total_amount,
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name || "Walk-in Customer",
    };

    setInvoiceData(invoiceFormatted);
    setCustomerPhone(sale.customer_phone || "");
    setThankYouOpen(true);
  }

  // ------------------------
  // RENDER
  // ------------------------
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
            {/* Search Bar */}
            <SalesSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showTrash={showTrash}
              setShowTrash={setShowTrash}
            />

            {/* Sales List */}
            <SalesList
              isLoading={salesQuery.isLoading}
              filteredSales={filteredSales}
              handleDelete={(id: string) => deleteSale.mutate(id)}
              handleRestore={(id: string) => restoreSale.mutate(id)}
              handlePermanentDelete={(id: string) => permanentDelete.mutate(id)}
              handleReturnSale={openReturnDialog}
              handlePrintSale={handlePrint}
              isSystemAdmin={isSystemAdmin}
            />
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
