"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Send, ImageDown, RotateCcw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import LabelBill from "./LabelBill";
import { SaleData } from "@/lib/type";
import { InvoiceData } from "@/lib/printer";

export function ThankYouModal({
  open,
  onOpenChange,
  invoiceData,
  customerPhone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  customerPhone: string;
}) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /*
    -------------------------------------------------------------
    SALE DATA
    -------------------------------------------------------------
  */
  const saleData: SaleData | null = invoiceData
    ? {
        items: (invoiceData.items ?? []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          discount_value: item.discountValue || 0,
          discount_amount: item.discountAmount || 0,
        })),
        totalAmount: invoiceData.total ?? 0,
        paymentMethod: invoiceData.paymentMethod ?? "Cash",
        invoiceNumber: invoiceData.invoiceNumber ?? "N/A",
        createdAt: invoiceData.date ?? new Date().toISOString(),
        customerName: invoiceData.customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
      }
    : null;

  const discountAmount = invoiceData?.discountAmount || 0;

  /*
    -------------------------------------------------------------
    GENERATE IMAGE — RUN ONLY ONE TIME
    -------------------------------------------------------------
  */
  const generatePreviewOnce = async () => {
    if (hasRenderedOnce) return;
    if (!invoiceRef.current) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await new Promise((res) => setTimeout(res, 150)); // allow DOM paint

      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#fff",
        scale: 3,
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
      setBase64Image(dataUrl.replace("data:image/png;base64,", ""));
      setHasRenderedOnce(true);
    } catch (err) {
      console.error("Preview generation failed:", err);
      setErrorMsg("Failed to generate preview");
    }

    setLoading(false);
  };

  // Fire ONLY ONCE per modal open
  useEffect(() => {
    if (!open) {
      setHasRenderedOnce(false);
      setPreviewUrl(null);
      setBase64Image(null);
      return;
    }

    const timer = setTimeout(generatePreviewOnce, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /*
    -------------------------------------------------------------
    PDF GENERATOR
    -------------------------------------------------------------
  */
  const generatePDF = async (): Promise<Blob | null> => {
  if (!invoiceRef.current) return null;

  setLoading(true);

  try {
    const canvas = await html2canvas(invoiceRef.current, {
      backgroundColor: "#fff",
      scale: 3,
    });

    const imgData = canvas.toDataURL("image/png");

    // Correct jsPDF initialization
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    return pdf.output("blob");
  } catch (e) {
    console.error("PDF Error:", e);
    return null;
  } finally {
    setLoading(false);
  }
};


  /*
    -------------------------------------------------------------
    BUTTONS
    -------------------------------------------------------------
  */
  const downloadPDF = async () => {
    const blob = await generatePDF();
    if (!blob) return;

    const file = new File([blob], "invoice.pdf", { type: "application/pdf" });
    const url = URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();

    URL.revokeObjectURL(url);
  };

  const sharePDF = async () => {
    const blob = await generatePDF();
    if (!blob) return;

    const file = new File([blob], "invoice.pdf", { type: "application/pdf" });
    const shareData = { files: [file] };

    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return;
    }

    const url = URL.createObjectURL(blob);
    const intentUrl = `intent:${encodeURIComponent(
      url
    )}#Intent;action=android.intent.action.SEND;type=application/pdf;end;`;

    window.location.assign(intentUrl);
  };

  const downloadPNG = () => {
    if (!previewUrl) return alert("Image not ready");

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "invoice.png";
    a.click();
  };

  const printNative = () => {
    if (!base64Image) return alert("Image not ready");

    const deep = `wts://print?type=receipt&image=${encodeURIComponent(
      base64Image
    )}`;

    window.location.href = deep;

    setTimeout(() => {
      window.location.href =
        "https://play.google.com/store/apps/details?id=com.example.wts";
    }, 1500);
  };

  const sendWhatsApp = () => {
    if (!customerPhone || customerPhone === "N/A")
      return alert("Invalid number");

    const msg = `Hello ${
      saleData?.customerName
    }!\nThanks for shopping.\nInvoice: ${
      saleData?.invoiceNumber
    }\nTotal: ₹${saleData?.totalAmount}`;

    window.open(
      `https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  /*
    -------------------------------------------------------------
    UI
    -------------------------------------------------------------
  */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="invoice-description" className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Invoice Receipt</DialogTitle>
        </DialogHeader>

        <p id="invoice-description" className="hidden">
          Customer invoice preview.
        </p>

        <div className="flex justify-center py-2 relative">
          {!previewUrl && (
            <div className="absolute text-gray-500 text-sm">
              {loading ? "Rendering…" : "Preparing…"}
            </div>
          )}

          <div
            ref={invoiceRef}
            className="scale-[0.93] origin-top "
          >
            {saleData && (
              <LabelBill data={saleData} discountAmount={discountAmount} />
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-center text-sm">{errorMsg}</p>
        )}

        <div className="flex flex-wrap gap-2 justify-center mt-3">
          <Button onClick={downloadPDF} disabled={loading}>
            <Printer className="mr-1 h-4 w-4" /> PDF
          </Button>

          <Button onClick={sharePDF} disabled={loading}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>

          <Button onClick={downloadPNG} disabled={!previewUrl || loading}>
            <ImageDown className="mr-1 h-4 w-4" /> PNG
          </Button>

          <Button
            onClick={printNative}
            disabled={!base64Image || loading}
            className="bg-blue-600 text-white"
          >
            Print
          </Button>

          <Button onClick={sendWhatsApp} disabled={loading}>
            <Send className="mr-1 h-4 w-4" /> WhatsApp
          </Button>
        </div>

        <div className="flex justify-center mt-2">
          <Button
            variant="ghost"
            onClick={() => {
              setHasRenderedOnce(false);
              setPreviewUrl(null);
              setBase64Image(null);
              generatePreviewOnce();
            }}
            disabled={loading}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Regenerate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
