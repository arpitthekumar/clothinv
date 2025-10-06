"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductLabel } from "./product-label";

type LabelPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id?: string; name: string; sku: string; price?: string | number; size?: string | null; categoryName?: string | null; barcode?: string };
};

export function LabelPreviewDialog({ open, onOpenChange, product }: LabelPreviewDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState<number>(1);

  const code = (product.barcode || product.sku).trim();

  const downloadImage = async () => {
    if (!labelRef.current) return;
    const canvas = await html2canvas(labelRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `label-${product.sku}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const printLabels = async () => {
    if (!labelRef.current) return;
    const canvas = await html2canvas(labelRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const dataUrl = canvas.toDataURL("image/png");

    const win = window.open("", "_blank");
    if (!win) return;
    const copies = Math.max(1, Math.min(100, Number(qty) || 1));
    const images = new Array(copies).fill(0).map(() => `<img src="${dataUrl}" style="margin:8px;" />`).join("");
    win.document.write(`
      <html>
        <head><title>Print Labels</title></head>
        <body style="display:flex;flex-wrap:wrap;align-items:flex-start;">${images}</body>
      </html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Product Label</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ProductLabel ref={labelRef} name={product.name} sku={product.sku} price={product.price} size={product.size} categoryName={product.categoryName} code={code} />
          <div className="flex items-center gap-2">
            <label className="text-sm">Quantity</label>
            <Input type="number" min={1} max={100} value={qty} onChange={(e) => setQty(parseInt(e.target.value || "1", 10))} className="w-24" />
            <div className="flex-1" />
            <Button variant="outline" onClick={downloadImage}>Download</Button>
            <Button onClick={printLabels}>Print</Button>
          </div>
       
        </div>
      </DialogContent>
    </Dialog>
  );
}


