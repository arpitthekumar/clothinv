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
  
  // Get sale-level discount from invoiceData
  const saleDiscountAmount = invoiceData?.discountAmount || 0;

  // ✅ Generate PDF blob for sharing/downloading
  const generatePDF = async (): Promise<Blob | null> => {
    if (!invoiceRef.current) return null;

    try {
      const element = invoiceRef.current;

      // Force element width to a fixed size during capture
      const originalWidth = element.style.width;
      element.style.width = `${element.scrollWidth}px`;

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
      });

      // Restore element width after render
      element.style.width = originalWidth;

      const imgData = canvas.toDataURL("image/png");
      const contentWidth = canvas.width;
      const contentHeight = canvas.height;

      const pdfWidth = contentWidth * 0.75;
      const pdfHeight = contentHeight * 0.75;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });

      // ✅ Full fill, no edges visible
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth + 3, pdfHeight);

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

      try {
        const shareData = {
          files: [pdfFile],
          title: "Invoice",
          text: `Here is your invoice from Bhootia Fabric Collection`,
        };

        // ✅ 1️⃣ Normal PWA/Phone Share
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          setLoading(false);
          return;
        }

        // ✅ 2️⃣ Android native intent fallback (same as your image version)
        if (/Android/i.test(navigator.userAgent)) {
          const blobUrl = URL.createObjectURL(pdfBlob);

          // Create Android intent for PDF
          const intentUrl = `intent:${encodeURIComponent(
            blobUrl
          )}#Intent;action=android.intent.action.SEND;type=application/pdf;end;`;

          window.location.assign(intentUrl);
          setLoading(false);
          return;
        }

        // ✅ 3️⃣ Fallback: trigger download
        alert(
          "Sharing not supported on this device. The invoice will be downloaded instead."
        );
        const url = URL.createObjectURL(pdfFile);
        const a = document.createElement("a");
        a.href = url;
        a.download = pdfFile.name;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Share failed:", err);
        alert("Sharing failed. Please try downloading manually.");
      }
    }

    setLoading(false);
  };

  // ✅ Send WhatsApp Message Only (no PDF)
  const handleSendToCustomer = async () => {
    // Skip WhatsApp if using default/placeholder phone number
    if (
      !customerPhone ||
      customerPhone === "0000000000" ||
      customerPhone === "N/A"
    ) {
      return alert("Customer phone number not available for WhatsApp sharing");
    }

    setLoading(true);

    if (saleData) {
      // ✅ Custom WhatsApp message
      const message = `Hello ${saleData.customerName || "dear customer"}! 😊
Thank you for shopping with *Bhootia Fabric Collection* 🛍️

🧾 *Invoice Details*
• Invoice No: ${saleData.invoiceNumber}
• Date: ${new Date(saleData.createdAt ?? new Date()).toLocaleDateString()}
• Payment Method: ${saleData.paymentMethod}
• Total Amount: ₹${Math.round(saleData.totalAmount)}

We appreciate your purchase ❤️`;

      // ✅ Create WhatsApp message link
      const whatsappUrl = `https://wa.me/${customerPhone.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodeURIComponent(message)}`;

      // ✅ Open WhatsApp directly
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
        {/* Bill Preview */}
        <div className="flex justify-center">
          <div ref={invoiceRef} className="scale-[0.95] origin-top">
            {saleData && <LabelBill data={saleData} discountAmount={saleDiscountAmount} />}
          </div>
        </div>

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
