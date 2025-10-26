"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function LabelPreviewDialog({ open, onOpenChange, product }: LabelPreviewDialogProps) {
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

  const handleGenerateFile = async (type: "print" | "download" | "bluetooth") => {
    if (!labelRef.current) return;
    setLoading(true);

    const canvas = await generateCanvas();
    if (!canvas) {
      setLoading(false);
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `label-${product.sku}.png`, {
      type: "image/png",
    });

    try {
      if (type === "print") {
        // 🔹 Share to system printer or nearby share
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Product Label",
            text: `Label for ${product.name}`,
          });
        } else {
          alert("Sharing not supported on this device");
        }
      } else if (type === "download") {
        // 🔹 Download PNG
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `label-${product.sku}.png`;
        link.click();
      } else if (type === "bluetooth") {
        // 🔹 Print directly via Mate Bluetooth Print app
        const base64 = dataUrl.replace("data:image/png;base64,", "");
        const printData = `<IMAGE>1#${base64}`; // align center
        const intentUrl = `intent:${encodeURIComponent(
          printData
        )}#Intent;scheme=my.bluetoothprint.scheme;package=mate.bluetoothprint;end;`;

        // Open Bluetooth Print app
        window.location.href = intentUrl;
      }
    } catch (err) {
      console.error(err);
      alert("Action failed. Try again.");
    } finally {
      setLoading(false);
    }
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

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => handleGenerateFile("print")}
              disabled={!barcodeLoaded || loading}
            >
              {loading ? "Generating..." : !barcodeLoaded ? "Loading..." : "Print"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleGenerateFile("download")}
              disabled={!barcodeLoaded || loading}
            >
              {loading ? "Generating..." : !barcodeLoaded ? "Loading..." : "Download"}
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleGenerateFile("bluetooth")}
              disabled={!barcodeLoaded || loading}
            >
              {loading ? "Connecting..." : "Bluetooth Print"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
