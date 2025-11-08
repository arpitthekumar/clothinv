"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
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
  const [shareError, setShareError] = useState(false);

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

  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create image blob"));
        },
        "image/png",
        1
      );
    });

  const triggerDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `label-${product.sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.replace(/^data:image\/png;base64,/, ""));
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = () =>
        reject(reader.error || new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });

  const handleGenerateFile = async (
    type: "print" | "download" | "bluetooth"
  ) => {
    if (!labelRef.current) return;
    setLoading(true);

    let objectUrl: string | undefined;
    try {
      const canvas = await generateCanvas();
      if (!canvas) {
        throw new Error("Unable to render product label");
      }

      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `label-${product.sku}.png`, {
        type: "image/png",
      });

      objectUrl = URL.createObjectURL(blob);

      if (type === "print") {
        const shareData = {
          files: [file],
          title: "Product Label",
          text: `Label for ${product.name}`,
        };

        if (navigator.share && navigator.canShare?.(shareData)) {
          try {
            await navigator.share(shareData);
          } catch (shareError) {
            console.warn("Share failed", shareError);
            // show popup for retry/cancel instead of auto-download
            setShareError(true);
          }
        } else {
          // device doesn’t support share
          setShareError(true);
        }
      } else if (type === "download") {
        triggerDownload(objectUrl);
      } else if (type === "bluetooth") {
        const base64 = await blobToBase64(blob);
        const printData = `<IMAGE>1#${base64}`; // align center
        const intentUrl = `intent:${encodeURIComponent(
          printData
        )}#Intent;scheme=my.bluetoothprint.scheme;package=mate.bluetoothprint;end;`;

        // Open Bluetooth Print app
        window.location.assign(intentUrl);
      }
    } catch (err) {
      console.error(err);
      alert("Action failed. Try again.");
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
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
            {shareError && (
              <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-3 text-center mt-3">
                <p className="mb-2 font-medium">Share failed. Try again?</p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShareError(false);
                      handleGenerateFile("print"); // retry sharing
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShareError(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

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
