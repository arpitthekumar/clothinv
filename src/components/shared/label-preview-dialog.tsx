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
  const [barcodeLoaded, setBarcodeLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [copiesDialogOpen, setCopiesDialogOpen] = useState(false);
  const [printConfirmOpen, setPrintConfirmOpen] = useState(false);
  const [copies, setCopies] = useState(1);

  const code = (product.barcode || product.sku).trim();

  // --- Helpers ---
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
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        1
      );
    });

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Base64 conversion failed"));
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

  // --- Auto-generate image silently in background ---
  useEffect(() => {
    if (!open || !barcodeLoaded || previewUrl || loading) return;
    let isCancelled = false;

    const generatePreviewSilently = async () => {
      try {
        setLoading(true);
        const canvas = await generateCanvas();
        if (!canvas || isCancelled) return;
        const blob = await canvasToBlob(canvas);
        if (isCancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Preview generation failed:", err);
      } finally {
        setLoading(false);
      }
    };

    // Defer slightly to ensure smooth render
    setTimeout(generatePreviewSilently, 200);

    return () => {
      isCancelled = true;
    };
  }, [open, barcodeLoaded]);

  // --- Actions ---
  const handleGenerateFile = async (
    type: "print" | "download" | "bluetooth"
  ) => {
    try {
      setLoading(true);

      const response = previewUrl
        ? await fetch(previewUrl)
        : await (async () => {
            const canvas = await generateCanvas();
            if (!canvas) throw new Error("Unable to render label");
            const blob = await canvasToBlob(canvas);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            return new Response(blob);
          })();

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const file = new File([blob], `label-${product.sku}.png`, {
        type: "image/png",
      });

      if (type === "print") {
        const shareData = {
          files: [file],
          title: "Product Label",
          text: `Label for ${product.name}`,
        };

        try {
          // Try normal share (works on phones)
          if (navigator.share && navigator.canShare?.(shareData)) {
            await navigator.share(shareData);
            return;
          }

          // 📱 If tablet or Android device — use native intent
          if (/Android/i.test(navigator.userAgent)) {
            const blobUrl = previewUrl || URL.createObjectURL(blob);

            // Android native share intent
            const intentUrl = `intent:${encodeURIComponent(
              blobUrl
            )}#Intent;action=android.intent.action.SEND;type=image/png;end;`;

            window.location.assign(intentUrl);
            return;
          }

          // Otherwise fallback
          setShareError(true);
        } catch (err) {
          console.error("Share failed:", err);
          setShareError(true);
        }
      } else if (type === "download") {
        triggerDownload(previewUrl || URL.createObjectURL(blob));
      } else if (type === "bluetooth") {
        setCopiesDialogOpen(true);
      }
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBluetoothPrint = async () => {
    setCopiesDialogOpen(false);
    setLoading(true);
    try {
      if (!previewUrl) throw new Error("No preview available");
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const printData = `<IMAGE>1#${base64.replace(
        /^data:image\/png;base64,/,
        ""
      )}`;
      const intentUrl = `intent:${encodeURIComponent(
        printData
      )}#Intent;scheme=my.bluetoothprint.scheme;package=mate.bluetoothprint;end;`;

      for (let i = 0; i < copies; i++) {
        window.location.assign(intentUrl);
        await new Promise((res) => setTimeout(res, 1500));
      }
      setTimeout(() => setPrintConfirmOpen(true), 800);
    } catch (err) {
      console.error("Bluetooth print failed:", err);
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
            {/* Instantly show live label until generated image replaces it */}
            <div className="flex justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Label Preview"
                  className="rounded-md border w-[280px] h-auto transition-opacity duration-300"
                />
              ) : (
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
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="secondary"
                onClick={() => handleGenerateFile("print")}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "Working..." : "Print"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleGenerateFile("download")}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "Working..." : "Download"}
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleGenerateFile("bluetooth")}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "Connecting..." : "Bluetooth Print"}
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
      </Dialog>

      {/* Copies input popup */}
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
              <Button
                variant="ghost"
                onClick={() => setCopiesDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation popup */}
      <Dialog open={printConfirmOpen} onOpenChange={setPrintConfirmOpen}>
        <DialogContent className="sm:max-w-[350px] text-center">
          <DialogHeader>
            <DialogTitle>Print Confirmation</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 mb-4">
            Did all {copies} {copies > 1 ? "copies" : "copy"} print
            successfully?
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
