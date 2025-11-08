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
  const [copies, setCopies] = useState(1);
  const [printing, setPrinting] = useState(false);

  const code = (product.barcode || product.sku).trim();

  /** Wait for barcode images before rendering */
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

  /** Render to canvas */
  const generateCanvas = async () => {
    if (!labelRef.current) return null;
    await waitForImages(labelRef.current);
    return html2canvas(labelRef.current, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
    });
  };

  /** Canvas → Blob */
  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject("Blob failed")), "image/png");
    });

  /** Blob → Base64 string */
  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string")
          resolve(reader.result.replace(/^data:image\/png;base64,/, ""));
        else reject("Invalid result");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  /** Trigger download (for testing or fallback) */
  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Generate TXT for Mate Bluetooth Print app */
  const generateBluetoothTxt = async (base64: string) => {
    const commands = [
      "ALIGN 1",
      "<IMAGE>1#" + base64,
      "PRINT " + copies,
    ].join("\n");
    const blob = new Blob([commands], { type: "text/plain" });
    const fileName = `label-${product.sku}.txt`;
    triggerDownload(blob, fileName);

    const intentUrl = `intent:file:///storage/emulated/0/Download/${fileName}#Intent;scheme=text/plain;package=mate.bluetoothprint;end;`;
    setTimeout(() => (window.location.href = intentUrl), 1000);
  };

  /** Web Bluetooth API printing */
  const printDirectBluetooth = async (base64: string) => {
    if (!navigator.bluetooth) {
      alert("Bluetooth not supported on this browser.");
      return;
    }
    try {
      setPrinting(true);
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0x1108],
      });
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService(0x1108);
      const characteristic = await service?.getCharacteristic(0x2a57);

      // Send image base64 as raw bytes (simplified)
      const encoder = new TextEncoder();
      const payload = encoder.encode(`<IMAGE>1#${base64}\n`);
      for (let i = 0; i < copies; i++) {
        await characteristic?.writeValue(payload);
      }
      alert("✅ Printed successfully via Web Bluetooth!");
    } catch (err) {
      console.error("Bluetooth print failed", err);
      alert("❌ Bluetooth print failed");
    } finally {
      setPrinting(false);
    }
  };

  /** Handle print type selection */
  const handleGenerateFile = async (type: "print" | "download" | "bluetooth") => {
    if (!labelRef.current) return;
    setLoading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Canvas failed");
      const blob = await canvasToBlob(canvas);
      const base64 = await blobToBase64(blob);

      if (type === "print") {
        const file = new File([blob], `label-${product.sku}.png`, {
          type: "image/png",
        });
        const shareData = { files: [file], title: "Product Label" };
        if (navigator.share && navigator.canShare?.(shareData)) {
          try {
            await navigator.share(shareData);
            alert("✅ Shared to print app successfully!");
          } catch {
            setShareError(true);
          }
        } else {
          setShareError(true);
        }
      } else if (type === "download") {
        triggerDownload(blob, `label-${product.sku}.png`);
      } else if (type === "bluetooth") {
        // ask how to print: option 1 → app, option 2 → direct
        const useApp = confirm("Use Mate Bluetooth Print App?\nCancel for direct Web Bluetooth printing.");
        if (useApp) await generateBluetoothTxt(base64);
        else await printDirectBluetooth(base64);
      }
    } catch (e) {
      console.error(e);
      alert("⚠️ Action failed");
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
              onClick={() => setCopiesDialogOpen(true)}
              disabled={!barcodeLoaded || loading}
            >
              {printing ? "Printing..." : "Bluetooth Print"}
            </Button>
          </div>

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
                onClick={async () => {
                  setCopiesDialogOpen(false);
                  await handleGenerateFile("bluetooth");
                }}
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
    </Dialog>
  );
}
