"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);

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

  const printLabel = async () => {
    if (!labelRef.current) return;
    await waitForImages(labelRef.current);

    // Open native print dialog
    const printWindow = window.open("", "_blank");
    printWindow!.document.write(
      `<html><head><title>Print Label</title></head><body>${labelRef.current!.outerHTML}</body></html>`
    );
    printWindow!.document.close();
    printWindow!.focus();
    printWindow!.print();
  };

  const downloadPDF = async () => {
    setLoading(true);
    const canvas = await generateCanvas();
    if (!canvas) return setLoading(false);

    const imgData = canvas.toDataURL("image/png");

    const labelWidthMM = 90;
    const labelHeightMM = 90;

    const pdf = new jsPDF({
      unit: "mm",
      format: [labelWidthMM, labelHeightMM],
      compress: true,
    });

    const copies = Math.max(1, Math.min(100, Number(qty) || 1));
    for (let i = 0; i < copies; i++) {
      if (i > 0) pdf.addPage([labelWidthMM, labelHeightMM]);
      pdf.addImage(imgData, "PNG", 0, 0, labelWidthMM, labelHeightMM);
    }

    pdf.save(`label-${product.sku}.pdf`);
    setLoading(false);
  };

  const shareLabel = async () => {
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

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator
        .share({
          files: [file],
          title: "Product Label",
          text: `Label for ${product.name}`,
        })
        .catch((err) => console.error("Share failed:", err));
    } else {
      alert("Sharing not supported on this device");
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
            name={product.name}
            sku={product.sku}
            price={product.price}
            size={product.size}
            categoryName={product.categoryName}
            code={code}
          />

          <div className="flex items-center gap-2">
            {/* <label className="text-sm">Quantity</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
              className="w-24"
            /> */}
            {/* <div className="flex-1" />
            <Button onClick={printLabel}>Print Label</Button>

            <Button variant="outline" onClick={downloadPDF} disabled={loading}>
              {loading ? "Generating..." : "Download PDF"}
            </Button> */}

            <Button variant="secondary" onClick={shareLabel} disabled={loading}>
              {loading ? "Generating..." : "Print"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
