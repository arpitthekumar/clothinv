"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Send } from "lucide-react";
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

  // ✅ Generate PDF blob for sharing/downloading
  const generatePDF = async (): Promise<Blob | null> => {
    if (!invoiceRef.current) return null;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = canvas.width * 0.75;
      const pdfHeight = canvas.height * 0.75;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      return pdf.output("blob");
    } catch (err) {
      console.error("PDF Generation Failed:", err);
      return null;
    }
  };

  // ✅ Download PDF
  const handleDownloadPDF = async () => {
    setLoading(true);
    const pdfBlob = await generatePDF();
    if (pdfBlob && saleData) {
      const pdfFile = new File(
        [pdfBlob],
        `Invoice_${saleData.invoiceNumber}.pdf`,
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(pdfFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoading(false);
  };

  // ✅ Share PDF via Web Share API
  const handleSharePDF = async () => {
    setLoading(true);
    const pdfBlob = await generatePDF();
    if (pdfBlob && saleData) {
      const pdfFile = new File(
        [pdfBlob],
        `Invoice_${saleData.invoiceNumber}.pdf`,
        { type: "application/pdf" }
      );

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            title: "Invoice",
            text: `Here is your invoice from Bhootia Fabric Collection`,
            files: [pdfFile],
          });
        } catch (err) {
          console.error("Sharing failed:", err);
        }
      } else {
        alert("Sharing not supported on this device. PDF will download instead.");
        handleDownloadPDF();
      }
    }
    setLoading(false);
  };

  // ✅ Send PDF via WhatsApp link
  const handleSendToCustomer = async () => {
    if (!customerPhone) return alert("Customer number not available");

    setLoading(true);
    const pdfBlob = await generatePDF();
    if (pdfBlob) {
      const pdfFile = new File(
        [pdfBlob],
        `Invoice_${saleData?.invoiceNumber}.pdf`,
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(pdfFile);

      // WhatsApp Web URL to prefill text with download link
      const whatsappUrl = `https://wa.me/${customerPhone.replace(
        /[^0-9]/g,
        ""
      )}?text=Hello%20${encodeURIComponent(
        saleData?.customerName || ""
      )},%20here%20is%20your%20invoice:%20${encodeURIComponent(url)}`;

      window.open(whatsappUrl, "_blank");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Thank you for your purchase!
          </DialogTitle>
        </DialogHeader>

        {/* Bill Preview */}
        <div ref={invoiceRef}>{saleData && <LabelBill data={saleData} />}</div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          <Button onClick={handleDownloadPDF} disabled={loading}>
            <Printer className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Download PDF"}
          </Button>

          <Button onClick={handleSharePDF} disabled={loading}>
            <Share2 className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Share PDF"}
          </Button>

          <Button onClick={handleSendToCustomer} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Send to Customer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
