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
  const [copies, setCopies] = useState(1);

  const code = (product.barcode || product.sku).trim();

  /* ---------- Helpers ---------- */
  const waitForImages = async (element: HTMLElement) => {
    const imgs = Array.from(element.querySelectorAll("img"));
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

  /* ---------- Auto Preview ---------- */
  useEffect(() => {
    if (!open || !barcodeLoaded || previewUrl || loading) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const canvas = await generateCanvas();
        if (!canvas || cancelled) return;

        const blob = await canvasToBlob(canvas);
        if (cancelled) return;

        setPreviewUrl(URL.createObjectURL(blob));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setTimeout(run, 200);
    return () => {
      cancelled = true;
    };
  }, [open, barcodeLoaded]);

  /* ---------- Download ---------- */
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `label-${product.sku}.png`;
    a.click();
  };

  /* ---------- Share (normal android share) ---------- */
  const handleShare = async () => {
    if (!previewUrl) return;
    setLoading(true);

    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], "label.png", { type: "image/png" });

      const shareData = {
        files: [file],
        title: "Product Label",
        text: `Label for ${product.name}`,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      if (/Android/i.test(navigator.userAgent)) {
        const intentUrl = `intent:${encodeURIComponent(
          previewUrl
        )}#Intent;action=android.intent.action.SEND;type=image/png;end;`;

        window.location.assign(intentUrl);
        return;
      }

      alert("Sharing not supported.");
    } catch (err) {
      console.error("Share failed:", err);
      setShareError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Print (Native App) Step 1: Open Copies Dialog ---------- */
  const requestNativePrint = () => {
    setCopiesDialogOpen(true);
  };

  /* ---------- Print (Native App) Step 2: Deep Link ---------- */
  const handleNativeAppPrint = async () => {
    try {
      setLoading(true);

      const response = previewUrl
        ? await fetch(previewUrl)
        : await (async () => {
            const canvas = await generateCanvas();
            if (!canvas) throw new Error("Unable to render");

            const blob = await canvasToBlob(canvas);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

            return new Response(blob);
          })();

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const cleanB64 = base64.replace(/^data:image\/png;base64,/, "");

      const deepLink = `wts://print?image=${encodeURIComponent(
        cleanB64
      )}&copies=${copies}`;

      window.location.href = deepLink;

      // fallback after 1.5 sec

      // setTimeout(() => {
      //   window.location.href =
      //     "https://play.google.com/store/apps/details?id=com.example.wts";
      // }, 1500);
    } catch (err) {
      console.error("Native print failed:", err);
      alert("Failed to send to native app.");
    } finally {
      setLoading(false);
      setCopiesDialogOpen(false);
    }
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Product Label</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 items-center">
            {/* Preview */}
            <div className="flex justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Label Preview"
                  className="rounded-md border w-[280px]"
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

            {/* Buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* Share */}
              <Button
                variant="secondary"
                onClick={handleShare}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "..." : "Share"}
              </Button>

              {/* Download */}
              <Button
                variant="secondary"
                onClick={handleDownload}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "..." : "Download"}
              </Button>

              {/* Print Native */}
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={requestNativePrint}
                disabled={!barcodeLoaded || loading}
              >
                {loading ? "..." : "Print (Native)"}
              </Button>
            </div>

            {/* Share Error */}
            {shareError && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">
                Share failed. Try again?
                <div className="flex justify-center gap-2 mt-2">
                  <Button size="sm" onClick={handleShare}>
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
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

      {/* Copies Dialog */}
      <Dialog open={copiesDialogOpen} onOpenChange={setCopiesDialogOpen}>
        <DialogContent className="sm:max-w-[350px] text-center">
          <DialogHeader>
            <DialogTitle>How many copies?</DialogTitle>
          </DialogHeader>

          <Input
            type="number"
            min={1}
            value={copies}
            onChange={(e) => setCopies(Number(e.target.value))}
            className="w-24 mx-auto text-center"
          />

          <div className="flex justify-center gap-3 mt-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleNativeAppPrint}
            >
              Print Now
            </Button>

            <Button variant="ghost" onClick={() => setCopiesDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
