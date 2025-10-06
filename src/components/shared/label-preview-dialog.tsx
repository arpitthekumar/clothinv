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
    const [loading, setLoading] = useState(false);
    const labelRef = useRef<HTMLDivElement>(null);
    const [qty, setQty] = useState<number>(1);

    const code = (product.barcode || product.sku).trim();

    const waitForImages = async (element: HTMLElement) => {
        const imgs = Array.from(element.querySelectorAll("img"));
        await Promise.all(
            imgs.map(
                (img) =>
                    new Promise<void>((resolve) => {
                        if (img.complete) return resolve();
                        img.onload = () => resolve();
                        img.onerror = () => resolve(); // resolve even if image fails
                    })
            )
        );
    };

    const generateCanvas = async () => {
        if (!labelRef.current) return null;

        // wait for all images to load
        await waitForImages(labelRef.current);

        return await html2canvas(labelRef.current, {
            backgroundColor: "#ffffff",
            scale: 3,
            useCORS: true,   // required for cross-origin images
            allowTaint: false,
        });
    };


    const downloadImage = async () => {
        setLoading(true);
        const canvas = await generateCanvas();
        if (!canvas) return setLoading(false);

        const link = document.createElement("a");
        link.download = `label-${product.sku}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        setLoading(false);
    };

    // And disable buttons in JSX: <Button disabled={loading} ...>

    const printLabels = async () => {
        const canvas = await generateCanvas();
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
      
        const copies = Math.max(1, Math.min(100, Number(qty) || 1));
        const imagesHtml = new Array(copies)
          .fill(0)
          .map(() => `<img src="${dataUrl}" style="margin:8px; width:300px;" />`)
          .join("");
      
        const win = window.open("", "_blank");
        if (!win) return;
      
        win.document.write(`
          <html>
            <head>
              <title>Print Labels</title>
              <style>
                body { display:flex; flex-wrap:wrap; align-items:flex-start; margin:0; padding:0; }
                img { display:block; }
              </style>
            </head>
            <body>${imagesHtml}</body>
          </html>
        `);
      
        win.document.close();
      
        // Wait for images to load in the new window
        const waitForWinImages = () =>
          new Promise<void>((resolve) => {
            const imgs = Array.from(win.document.images);
            if (imgs.length === 0) return resolve();
      
            let loaded = 0;
            imgs.forEach((img) => {
              if (img.complete) {
                loaded++;
                if (loaded === imgs.length) resolve();
              } else {
                img.onload = () => {
                  loaded++;
                  if (loaded === imgs.length) resolve();
                };
                img.onerror = () => {
                  loaded++;
                  if (loaded === imgs.length) resolve();
                };
              }
            });
          });
      
        await waitForWinImages();
        win.focus();
        win.print();
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
                        <label className="text-sm">Quantity</label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
                            className="w-24"
                        />
                        <div className="flex-1" />
                        <Button variant="outline" onClick={downloadImage} disabled={loading} >
                            Download
                        </Button>
                        <Button onClick={printLabels}>Print</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
