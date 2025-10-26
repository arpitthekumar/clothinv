"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import LabelBill from "./LabelBill";
import { SaleData } from "@/lib/type";
import { InvoiceData } from "@/lib/printer";

interface ThankYouModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  customerPhone: string;
}

export function ThankYouModal({
  open,
  onOpenChange,
  invoiceData,
  customerPhone,
}: ThankYouModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const saleData: SaleData | null = invoiceData
    ? {
        items: (invoiceData.items ?? []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          discount_value: item.discountValue || item.discount_value || 0,
          discount_amount: item.discountAmount || item.discount_amount || 0,
        })),
        totalAmount: invoiceData.total ?? 0,
        paymentMethod: invoiceData.paymentMethod ?? "Cash",
        invoiceNumber: invoiceData.invoiceNumber ?? "N/A",
        createdAt: invoiceData.date ?? new Date().toISOString(),
        customerName: invoiceData.customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
      }
    : null;

  const handlePrintInvoice = async () => {
    if (!invoiceRef.current) return;
    setLoading(true);

    const canvas = await html2canvas(invoiceRef.current, {
      backgroundColor: "#ffffff",
      scale: 4, // sharper
      useCORS: true,
      allowTaint: true,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "invoice.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator
        .share({
          files: [file],
          title: "Invoice",
          text: "Thank you for your purchase!",
        })
        .catch((err) => console.error("Share failed:", err));
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "invoice.png";
      link.click();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thank you for your purchase!</DialogTitle>
        </DialogHeader>

        <div ref={invoiceRef}>{saleData && <LabelBill data={saleData} />}</div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handlePrintInvoice} disabled={loading}>
            <Printer className="mr-2 h-4 w-4" />{" "}
            {loading ? "Generating..." : "Print Bill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
