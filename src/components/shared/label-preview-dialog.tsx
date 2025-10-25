"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductLabel } from "./product-label";

type LabelPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id?: string;
    name: string;
    sku: string;
    price?: string | number;
    size?: string | null;
    categoryName?: string | null;
    barcode?: string;
  };
};

export function LabelPreviewDialog({
  open,
  onOpenChange,
  product,
}: LabelPreviewDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeLoaded, setBarcodeLoaded] = useState(false);

  const code = (product.barcode || product.sku).trim();

  const waitForImages = async (element: HTMLElement) => {
    const imgs = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  };

  const generateCanvas = async () => {
    if (!labelRef.current) return null;
    await waitForImages(labelRef.current);
    return html2canvas(labelRef.current, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      allowTaint: false,
    });
  };

  const handleGenerateFile = async (type: "print" | "download") => {
    if (!labelRef.current) return;
    setLoading(true);

    const canvas = await generateCanvas();
    if (!canvas) return setLoading(false);

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `label-${product.sku}.png`, {
      type: "image/png",
    });

    if (type === "print") {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator
          .share({
            files: [file],
            title: "Product Label",
            text: `Label for ${product.name}`,
          })
          .catch((err) => console.error("Share failed:", err));
      } else {
        alert("Sharing not supported on this device");
      }
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `label-${product.sku}.png`;
      link.click();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Product Label</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 items-center">
          <ProductLabel
            ref={labelRef}
            name={product.name ?? ""}
            sku={product.sku ?? ""}
            price={product.price ?? ""}
            size={product.size ?? ""}
            categoryName={product.categoryName ?? ""}
            code={code}
            onBarcodeLoad={() => setBarcodeLoaded(true)}
          />

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => handleGenerateFile("print")}
              disabled={!barcodeLoaded || loading}
            >
              {loading
                ? "Generating..."
                : !barcodeLoaded
                ? "Loading..."
                : "Print"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleGenerateFile("download")}
              disabled={!barcodeLoaded || loading}
            >
              {loading
                ? "Generating..."
                : !barcodeLoaded
                ? "Loading..."
                : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
