"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Send } from "lucide-react";
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
  const billRef = useRef<HTMLDivElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const saleDiscountAmount = invoiceData?.discountAmount || 0;

  // -------- Helpers ----------
  const waitForImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  };

  const generateCanvas = async () => {
    if (!billRef.current) return null;

    await waitForImages(billRef.current);

    return html2canvas(billRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: false,
    });
  };

  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject("Unable to create blob");
        },
        "image/png",
        1
      );
    });

  // ---------- AUTO GENERATE IMAGE WHEN MODAL OPENS ----------
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const generatePreview = async () => {
      try {
        setLoading(true);

        await new Promise((r) => setTimeout(r, 150)); // allow UI render

        const canvas = await generateCanvas();
        if (!canvas || cancelled) return;

        const blob = await canvasToBlob(canvas);
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Preview image generation failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generatePreview();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ---------- CLEAR IMAGE WHEN MODAL CLOSES ----------
  useEffect(() => {
    if (!open && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setLoading(false);
    }
  }, [open, previewUrl]);

  // ---------- Download ----------
  const handleDownloadImage = () => {
    if (!previewUrl) return;

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `Invoice_${saleData?.invoiceNumber}.png`;
    a.click();
  };

  // ---------- Share ----------
  const handleShareImage = async () => {
    if (!previewUrl) return;

    setLoading(true);

    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], "invoice.png", { type: "image/png" });

      const shareData = { files: [file], title: "Invoice", text: "Your Invoice" };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      // Android fallback intent
      if (/Android/i.test(navigator.userAgent)) {
        const intentUrl = `intent:${encodeURIComponent(
          previewUrl
        )}#Intent;action=android.intent.action.SEND;type=image/png;end;`;

        window.location.assign(intentUrl);
        return;
      }

      alert("Sharing not supported, downloading instead.");
      handleDownloadImage();
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- WhatsApp ----------
  const handleSendWhatsApp = () => {
    if (!customerPhone || customerPhone === "N/A") {
      alert("Invalid phone number");
      return;
    }

    const msg = `Hello ${
      saleData?.customerName
    }! 😊\nThank you for shopping with *Bhootia Fabric Collection*!\nInvoice No: ${
      saleData?.invoiceNumber
    }\nTotal: ₹${saleData?.totalAmount}\nVisit again! ❤️`;

    const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Thank you for your purchase!
          </DialogTitle>
        </DialogHeader>

        {/* PREVIEW */}
        <div className="flex justify-center py-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              className="w-[280px] rounded border shadow-sm"
              alt="Invoice Preview"
            />
          ) : (
            <div ref={billRef}>
              {saleData && (
                <LabelBill
                  data={saleData}
                  discountAmount={saleDiscountAmount}
                />
              )}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          <Button disabled={!previewUrl || loading} onClick={handleDownloadImage}>
            <Printer className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Download"}
          </Button>

          <Button disabled={!previewUrl || loading} onClick={handleShareImage}>
            <Share2 className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Share"}
          </Button>

          <Button disabled={loading} onClick={handleSendWhatsApp}>
            <Send className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
