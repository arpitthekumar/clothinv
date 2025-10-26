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
import jsPDF from "jspdf";
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

  const handleDownloadPDF = async () => {
  if (!invoiceRef.current) return;
  setLoading(true);

  try {
    // Capture the bill area
    const canvas = await html2canvas(invoiceRef.current, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      allowTaint: true,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: invoiceRef.current.scrollWidth,
      windowHeight: invoiceRef.current.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    // Calculate exact PDF dimensions (matching rendered bill size)
    const pdfWidth = canvas.width * 0.75; // pixels → points
    const pdfHeight = canvas.height * 0.75;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [pdfWidth, pdfHeight], // EXACT size of your bill, no margin
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${saleData?.invoiceNumber || "Bill"}.pdf`);
  } catch (err) {
    console.error("PDF Generation Failed:", err);
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Thank you for your purchase!
          </DialogTitle>
        </DialogHeader>

        <div ref={invoiceRef}>
          {saleData && <LabelBill data={saleData} />}
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleDownloadPDF} disabled={loading}>
            <Printer className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
