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
  const [loading, setLoading] = useState(false);
  const [barcodeLoaded, setBarcodeLoaded] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [copiesDialogOpen, setCopiesDialogOpen] = useState(false);
  const [printConfirmOpen, setPrintConfirmOpen] = useState(false);
  const [copies, setCopies] = useState(1);

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

  const triggerDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `label-${product.sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateFile = async (type: "print" | "download" | "bluetooth") => {
    if (!labelRef.current) return;
    setLoading(true);
    let objectUrl: string | undefined;

    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Unable to render product label");

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
          } catch {
            setShareError(true);
          }
        } else {
          setShareError(true);
        }
      } else if (type === "download") {
        triggerDownload(objectUrl);
      } else if (type === "bluetooth") {
        // open copies dialog
        setCopiesDialogOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert("Action failed. Try again.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setLoading(false);
    }
  };

  const handleBluetoothPrint = async () => {
    setCopiesDialogOpen(false);
    setLoading(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Unable to render label");

      const blob = await canvasToBlob(canvas);
      const base64 = await blobToBase64(blob);
      const printData = `<IMAGE>1#${base64}`;
      const intentUrl = `intent:${encodeURIComponent(
        printData
      )}#Intent;scheme=my.bluetoothprint.scheme;package=mate.bluetoothprint;end;`;

      for (let i = 0; i < copies; i++) {
        window.location.assign(intentUrl);
        await new Promise((res) => setTimeout(res, 1500));
      }

      // open confirmation dialog
      setTimeout(() => setPrintConfirmOpen(true), 1000);
    } catch (err) {
      console.error(err);
      alert("Bluetooth print failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleGenerateFile("bluetooth")}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "Connecting..." : "Bluetooth Print"}
              </Button>
            </div>

            {/* Share failed popup */}
            {shareError && (
              <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg p-3 text-center mt-3">
                <p className="mb-2 font-medium">Share failed. Try again?</p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShareError(false);
                      handleGenerateFile("print");
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
          </div>
        </DialogContent>
      </Dialog>

      {/* 🧾 Copies Input Popup */}
      <Dialog open={copiesDialogOpen} onOpenChange={setCopiesDialogOpen}>
        <DialogContent className="sm:max-w-[350px] text-center">
          <DialogHeader>
            <DialogTitle>How many copies to print?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 items-center">
            <Input
              type="number"
              min={1}
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="w-24 text-center"
            />
            <div className="flex gap-3">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBluetoothPrint}
              >
                Print {copies} {copies > 1 ? "copies" : "copy"}
              </Button>
              <Button variant="ghost" onClick={() => setCopiesDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Print Confirmation Popup */}
      <Dialog open={printConfirmOpen} onOpenChange={setPrintConfirmOpen}>
        <DialogContent className="sm:max-w-[350px] text-center">
          <DialogHeader>
            <DialogTitle>Print Confirmation</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 mb-4">
            Did all {copies} {copies > 1 ? "copies" : "copy"} print successfully?
          </p>
          <div className="flex justify-center gap-3">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setPrintConfirmOpen(false)}
            >
              ✅ Yes
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPrintConfirmOpen(false);
                setCopiesDialogOpen(true);
              }}
            >
              🔁 Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
