"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Send, ImageDown, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

  // ====== STATES ======
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [barcodeBase64, setBarcodeBase64] = useState<string | null>(null);
  const isActive = useRef(true);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<
    "TEXT" | "IMAGE" | "PDF" | null
  >(null);
  useEffect(() => {
    isActive.current = open;

    if (open) {
      setPreviewUrl(null);
      setBase64Image(null);
      setPdfBlob(null);
      setLoading(false);
      setSelectedType(null);
      setStep(1);
    }
  }, [open]);

  // ====== SALE DATA ======
  const saleData: SaleData | null = invoiceData
    ? {
      items: (invoiceData.items ?? []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        discount_value: item.discount_value ?? item.discountValue ?? 0,
        discount_amount: item.discount_amount ?? item.discountAmount ?? 0,

      })),
      totalAmount: invoiceData.total ?? 0,
      paymentMethod: invoiceData.paymentMethod ?? "Cash",
      invoiceNumber: invoiceData.invoiceNumber ?? "N/A",
      createdAt: invoiceData.date ?? new Date().toISOString(),
      customerName: invoiceData.customerName || "Walk-in Customer",
      customerPhone: customerPhone || "N/A",
    }
    : null;

  const discountAmount =
    invoiceData?.discount_amount ??
    0;


  // ============================================================
  // SELECT HANDLERS
  // ============================================================



  // ---- IMAGE selected → generate PNG ----
  const handleSelectImage = async () => {
    if (loading) return;

    setSelectedType("IMAGE");
    setStep(2);

    if (!invoiceRef.current) return;

    setLoading(true);

    // Force UI repaint before html2canvas
    await new Promise((res) =>
      requestAnimationFrame(() => requestAnimationFrame(res))
    );

    // If modal closed during the frame → cancel
    if (!isActive.current || !invoiceRef.current) {
      setLoading(false);
      return;
    }

    const canvas = await html2canvas(invoiceRef.current, { scale: 3 });
    const url = canvas.toDataURL("image/png");

    setPreviewUrl(url);
    setBase64Image(url.replace("data:image/png;base64,", ""));

    setLoading(false);
  };

  // ---- PDF selected → generate PDF ----
  const handleSelectPDF = async () => {
    if (loading) return; // blocks double clicks

    setSelectedType("PDF");
    setStep(2);

    if (!invoiceRef.current) return;

    setLoading(true);

    await new Promise((res) =>
      requestAnimationFrame(() => requestAnimationFrame(res))
    );

    const canvas = await html2canvas(invoiceRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage({
      imageData: imgData,
      format: "PNG",
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    const blob = pdf.output("blob");
    setPdfBlob(blob);
    setLoading(false);
  };

  // ============================================================
  // ACTION BUTTONS
  // ============================================================

  const downloadPNG = () => {
    if (!previewUrl) return;

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "invoice.png";
    a.click();
  };

  const printNative = () => {
    if (!base64Image) return;

    const deep = `wts://print?type=receipt&image=${encodeURIComponent(
      base64Image
    )}`;

    window.location.href = deep;
  };

  const downloadPDF = () => {
    if (!pdfBlob) return;

    const file = new File([pdfBlob], "invoice.pdf", {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    a.click();

    URL.revokeObjectURL(url);
  };

  const sharePDF = () => {
    if (!pdfBlob) return;

    const file = new File([pdfBlob], "invoice.pdf", {
      type: "application/pdf",
    });
    const shareData = { files: [file] };

    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData);
      return;
    }
  };

  // ------------------- ADD THIS AT TOP OF FILE -------------------

  /**
   * Safely parse ANY datetime (MySQL, ISO, UTC, string, null)
   * And converts it into IST (Indian Standard Time)
   */
  const parseToIST = (input: any): Date => {
    if (!input) return new Date();

    let raw =
      typeof input === "string"
        ? input.replace(" ", "T") // convert MySQL "2025-01-29 10:22" → ISO
        : input;

    // If it's a string but does NOT end in Z → force UTC so IST conversion works
    if (typeof raw === "string" && !raw.endsWith("Z")) {
      raw += "Z";
    }

    const utc = new Date(raw);

    // If still invalid → fallback to now
    if (isNaN(utc.getTime())) {
      return new Date();
    }

    // Add IST offset: 5 hours 30 minutes
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    return new Date(utc.getTime() + IST_OFFSET);
  };

  // --------------------------------------------------------------------




  // ------------------ YOUR ORIGINAL COMPONENT BELOW -------------------

  const printFast = () => {
    if (!saleData) return;

    // Convert createdAt → IST safely
    const ist = parseToIST(saleData.createdAt);

    // Format date: dd/MM/yyyy
    const formattedDate = ist.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Format time: 12-hour "H:mm"
    let hour = ist.getHours();
    const minute = ist.getMinutes().toString().padStart(2, "0");
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    const formattedTime = `${hour}:${minute}`;

    // Calculate totals
    const itemsWithTotals = saleData.items.map((item) => ({
      ...item,
      itemSubtotal: item.price * item.quantity,
    }));

    const subtotal = Math.round(
      itemsWithTotals.reduce((s, i) => s + i.itemSubtotal, 0)
    );

    const totalDiscount =
      discountAmount > 0
        ? Math.round(discountAmount)
        : Math.round(
          itemsWithTotals.reduce(
            (sum, i) => sum + (i.discount_amount || 0),
            0
          )
        );

    const total = subtotal - totalDiscount;

    // Format numbers like 25,000
    const formatIN = (num: number) =>
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    // Build fast-print object
    const fastData = {
      invoiceNumber: saleData.invoiceNumber,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      date: formattedDate,
      time: formattedTime,
      paymentMethod: saleData.paymentMethod,
      items: saleData.items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: formatIN(i.price),
        total: formatIN(i.price * i.quantity),
      })),
      subtotal: formatIN(subtotal),
      discount: formatIN(totalDiscount),
      total: formatIN(total),
      barcode: barcodeBase64,
    };

    // Encode for deep link
    const json = JSON.stringify(fastData);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const deepLink = `wts://receipt?json=${encodeURIComponent(base64)}`;

    // Trigger Android App
    window.location.href = deepLink;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";

    // Remove spaces, +, -, brackets
    let cleaned = phone.replace(/[^0-9]/g, "");

    // If already starts with 91 (Indian number)
    if (cleaned.startsWith("91")) return cleaned;

    // Remove leading zero (e.g., 0987654321 → 987654321)
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);

    // Add India country code
    return "91" + cleaned;
  };

  const sendWhatsApp = () => {
    if (!customerPhone || customerPhone === "N/A")
      return alert("Invalid number");

    const phone = formatPhone(customerPhone);

    const msg =
      `Hello ${saleData?.customerName}!\n` +
      `Thanks for shopping with us.\n` +
      `Invoice: ${saleData?.invoiceNumber}\n` +
      `Total: ₹${saleData?.totalAmount}`;

    const encodedMsg = encodeURIComponent(msg).replace(/%0A/g, "%0A");

    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, "_blank");


  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Invoice Receipt</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* SHOW BILL UNTIL IMAGE IS GENERATED */}
        {!(selectedType === "IMAGE" && previewUrl) && (
          <div className="flex justify-center mt-3">
            <div ref={invoiceRef}>
              {saleData && (
                <LabelBill
                  data={saleData}
                  discountAmount={discountAmount}
                  onBarcode={setBarcodeBase64}
                />
              )}
            </div>
          </div>
        )}

        {/* SHOW IMAGE PREVIEW ONLY WHEN IMAGE MODE + PREVIEW GENERATED */}
        {selectedType === "IMAGE" && previewUrl && (
          <div className="flex justify-center mt-4">
            <img
              src={previewUrl}
              className="w-56 rounded shadow border"
              alt="Invoice Preview"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={sendWhatsApp}>
            <Send className="mr-1 h-4 w-4" /> WhatsApp
          </Button>
          <Button onClick={printFast} className="bg-green-600 text-white">
            Fast Print
          </Button>

        </div>
        {/* STEP 1 — SELECT MODE */}
        {step === 1 && (
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={handleSelectImage}>Image</Button>
            <Button onClick={handleSelectPDF}>PDF</Button>
          </div>
        )}

        {/* STEP 2 — TEXT OPTIONS */}

        {/* STEP 2 — IMAGE OPTIONS */}
        {step === 2 && selectedType === "IMAGE" && (
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={printNative}
              disabled={!base64Image || loading}
              className="bg-blue-600 text-white"
            >
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>

            <Button onClick={downloadPNG} disabled={!previewUrl}>
              <ImageDown className="mr-1 h-4 w-4" /> PNG Download
            </Button>

            <Button variant="ghost" onClick={() => setStep(1)} className="mt-3">
              <RotateCcw className="mr-1 h-4 w-4" /> Back
            </Button>
          </div>
        )}

        {/* STEP 2 — PDF OPTIONS */}
        {step === 2 && selectedType === "PDF" && (
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={downloadPDF} disabled={!pdfBlob}>
              <Printer className="mr-1 h-4 w-4" /> Download PDF
            </Button>

            <Button onClick={sharePDF} disabled={!pdfBlob}>
              <Share2 className="mr-1 h-4 w-4" /> Share PDF
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setLoading(false);
                setPreviewUrl(null);
                setBase64Image(null);
                setPdfBlob(null);
                setSelectedType(null);
                setStep(1);
              }}
              className="mt-3"
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
