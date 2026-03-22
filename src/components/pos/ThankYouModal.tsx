"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Send, ImageDown, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import LabelBill from "./LabelBill";
import { SaleData } from "@/lib/type";
import { InvoiceData } from "@/lib/printer";
import {
  getPosCheckoutPrefs,
  type ThankYouButtonId,
} from "@/lib/pos-checkout-prefs";
import { playAutomationSound } from "@/lib/sound";

export function ThankYouModal({
  open,
  onOpenChange,
  invoiceData,
  customerPhone,
  disableAutomation = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  customerPhone: string;
  /** e.g. Sales screen reprint — skip POS receipt automation. */
  disableAutomation?: boolean;
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
  const [autoCountdown, setAutoCountdown] = useState(0);
  const [automationRunning, setAutomationRunning] = useState(false);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    isActive.current = open;

    if (open) {
      setPreviewUrl(null);
      setBase64Image(null);
      setPdfBlob(null);
      setLoading(false);
      setSelectedType(null);
      setStep(1);
      setAutoCountdown(0);
      autoFiredRef.current = false;
      setAutomationRunning(false);
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
    invoiceData?.discountAmount ??  // from POS
    invoiceData?.discount_amount ?? // from DB
    0;

  const getItemDiscount = (item: any) => {
    return (
      item.discount_amount ??  // from DB
      item.discountAmount ??  // from POS object
      item.discount_value ??  // fallback
      0
    );
  };


  // ============================================================
  // SELECT HANDLERS
  // ============================================================



  // ---- IMAGE selected → generate PNG ----
  const handleSelectImage = async (): Promise<void> => {
    if (loading) return;

    setSelectedType("IMAGE");
    setStep(2);

    if (!invoiceRef.current) return;

    setLoading(true);

    await new Promise((res) =>
      requestAnimationFrame(() => requestAnimationFrame(res)),
    );

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
  const handleSelectPDF = async (): Promise<void> => {
    if (loading) return;

    setSelectedType("PDF");
    setStep(2);

    if (!invoiceRef.current) return;

    setLoading(true);

    await new Promise((res) =>
      requestAnimationFrame(() => requestAnimationFrame(res)),
    );

    if (!isActive.current || !invoiceRef.current) {
      setLoading(false);
      return;
    }

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

    /* ───────────────── IST DATE & TIME ───────────────── */
    const ist = parseToIST(saleData.createdAt);

    const formattedDate = ist.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let hour = ist.getHours();
    const minute = ist.getMinutes().toString().padStart(2, "0");
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    const formattedTime = `${hour}:${minute}`;

    /* ───────────────── CALCULATIONS ───────────────── */

    // 1️⃣ Gross per item
    const itemsWithGross = saleData.items.map((item) => {
      const gross = item.price * item.quantity;
      return { ...item, gross };
    });

    // 2️⃣ Subtotal (before discount)
    const subtotalRaw = itemsWithGross.reduce(
      (sum, i) => sum + i.gross,
      0
    );

    const subtotal = Math.round(subtotalRaw);

    // 3️⃣ Total discount (bill or item based)
    const totalDiscount =
      discountAmount && discountAmount > 0
        ? Math.round(discountAmount)
        : Math.round(
          itemsWithGross.reduce(
            (sum, i) => sum + getItemDiscount(i),
            0
          )
        );

    // 4️⃣ Distribute discount per item (proportional)
    const itemsFinal = itemsWithGross.map((item) => {
      const ratio = subtotalRaw > 0 ? item.gross / subtotalRaw : 0;
      const itemDiscount = Math.round(totalDiscount * ratio);
      const net = item.gross - itemDiscount;

      return {
        ...item,
        itemDiscount,
        net,
      };
    });

    // 5️⃣ Final payable
    const total = Math.round(
      itemsFinal.reduce((sum, i) => sum + i.net, 0)
    );

    /* ───────────────── FORMATTER ───────────────── */
    const formatIN = (num: number) =>
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    /* ───────────────── FAST PRINT DATA ───────────────── */
    const fastData = {
      invoiceNumber: saleData.invoiceNumber,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      date: formattedDate,
      time: formattedTime,
      paymentMethod: saleData.paymentMethod,

      items: itemsFinal.map((i) => ({
        name: i.name,
        qty: i.quantity,
        price: formatIN(i.price),        // rate
        gross: formatIN(i.gross),         // before discount
        discount: formatIN(i.itemDiscount), // item discount
        total: formatIN(i.net),           // after discount
      })),

      subtotal: formatIN(subtotal),        // before discount
      discount: formatIN(totalDiscount),   // total discount
      total: formatIN(total),              // final payable
      barcode: barcodeBase64,
    };

    /* ───────────────── DEEP LINK ───────────────── */
    const json = JSON.stringify(fastData);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const deepLink = `wts://receipt?json=${encodeURIComponent(base64)}`;

    // Trigger Android app
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

  /* Automation: reads latest prefs when receipt opens; handlers close over initial render — OK for one-shot actions. */
  useEffect(() => {
    if (!open || disableAutomation || !invoiceData) return;

    const p = getPosCheckoutPrefs();
    if (p.thankYouMode !== "automated") return;

    const btn = p.thankYouAutoButton;
    const secs = Math.max(0, p.thankYouAutoSeconds);

    let cancelled = false;

    const execute = async () => {
      if (cancelled) return;
      if (autoFiredRef.current) return; // user acted manually or already ran
      autoFiredRef.current = true;
      setAutomationRunning(true);

      // Play sound before automation if enabled
      if (p.soundEnabled) {
        playAutomationSound();
        // Small delay to let sound play before action
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      try {
        if (btn === "close") onOpenChange(false);
        else if (btn === "whatsapp") sendWhatsApp();
        else if (btn === "fast_print") printFast();
        else if (btn === "image") await handleSelectImage();
        else if (btn === "pdf") await handleSelectPDF();
      } finally {
        setAutomationRunning(false);
      }
    };

    if (secs === 0) {
      const raf = requestAnimationFrame(() => {
        if (cancelled) return;
        void execute();
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    setAutoCountdown(secs);
    let left = secs;
    const id = window.setInterval(() => {
      left -= 1;
      setAutoCountdown(left);
      if (left <= 0) {
        window.clearInterval(id);
        void execute();
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [open, disableAutomation, invoiceData?.invoiceNumber, onOpenChange]);

  const tyPrefs =
    open && !disableAutomation ? getPosCheckoutPrefs() : null;
  const thankYouAutomated = tyPrefs?.thankYouMode === "automated";
  const autoThankBtn: ThankYouButtonId | null = thankYouAutomated
    ? tyPrefs!.thankYouAutoButton
    : null;
  const thankYouSecs = tyPrefs?.thankYouAutoSeconds ?? 0;

  const autoSuffix = (id: ThankYouButtonId) =>
    thankYouAutomated &&
    autoThankBtn === id &&
    thankYouSecs > 0
      ? ` (${autoCountdown}s)`
      : "";

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
          <Button
            onClick={() => {
              autoFiredRef.current = true;
              sendWhatsApp();
            }}
            disabled={automationRunning}
            className={cn(
              thankYouAutomated &&
                autoThankBtn === "whatsapp" &&
                "ring-2 ring-primary",
            )}
          >
            {automationRunning && autoThankBtn === "whatsapp" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1 h-4 w-4" />
            )}
            WhatsApp{autoSuffix("whatsapp")}
          </Button>
          <Button
            onClick={() => {
              autoFiredRef.current = true;
              printFast();
            }}
            disabled={automationRunning}
            className={cn(
              "bg-green-600 text-white",
              thankYouAutomated &&
                autoThankBtn === "fast_print" &&
                "ring-2 ring-yellow-300",
            )}
          >
            {automationRunning && autoThankBtn === "fast_print" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-1 h-4 w-4" />
            )}
            Fast Print{autoSuffix("fast_print")}
          </Button>
        </div>
        {/* STEP 1 — SELECT MODE */}
        {step === 1 && (
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => void handleSelectImage()}
              disabled={automationRunning}
              className={cn(
                thankYouAutomated &&
                  autoThankBtn === "image" &&
                  "ring-2 ring-primary",
              )}
            >
              {automationRunning && autoThankBtn === "image" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Image{autoSuffix("image")}
            </Button>
            <Button
              onClick={() => {
                autoFiredRef.current = true;
                void handleSelectPDF();
              }}
              disabled={automationRunning}
              className={cn(
                thankYouAutomated &&
                  autoThankBtn === "pdf" &&
                  "ring-2 ring-primary",
              )}
            >
              {automationRunning && autoThankBtn === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              PDF{autoSuffix("pdf")}
            </Button>
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
