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
import { useStoreSettings } from "@/hooks/use-store-settings";

type LabelPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id?: string;
    name: string;
    sku: string;
    price?: string | number;
    minPrice?: string | number;
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
  const { settings: activeStoreSettings, isLoading: isSettingsLoading } = useStoreSettings();
  const labelRef = useRef<HTMLDivElement>(null);
  const [barcodeLoaded, setBarcodeLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareError, setShareError] = useState(false);

  const [copiesDialogOpen, setCopiesDialogOpen] = useState(false);
  const [copies, setCopies] = useState(1);

  const code = (product.barcode || product.sku).trim();

  /* ---------- Reset Preview state on open ---------- */
  useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      setBarcodeLoaded(false);
    }
  }, [open]);

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
      scale: 2,
      useCORS: true,
      allowTaint: false,
      onclone: (clonedDoc) => {
        const label = clonedDoc.querySelector("[data-product-label]") as HTMLElement;
        if (label) {
          label.style.backgroundColor = "#ffffff";
          label.style.color = "#000000";
          const allEls = label.querySelectorAll("*");
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const style = window.getComputedStyle(htmlEl);
            if (style.color && (style.color.includes("lab") || style.color.includes("oklch"))) {
              htmlEl.style.color = "#000000";
            }
            if (style.backgroundColor && (style.backgroundColor.includes("lab") || style.backgroundColor.includes("oklch"))) {
              htmlEl.style.backgroundColor = "#ffffff";
            }
          });
        }
      },
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
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!open || !barcodeLoaded || previewUrl || isSettingsLoading || isGeneratingRef.current) return;
    let cancelled = false;
    isGeneratingRef.current = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const canvas = await generateCanvas();
        if (!canvas || cancelled) {
          isGeneratingRef.current = false;
          if (!cancelled) setLoading(false);
          return;
        }

        const blob = await canvasToBlob(canvas);
        if (cancelled) {
          isGeneratingRef.current = false;
          return;
        }

        setPreviewUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Preview generation failed:", err);
      } finally {
        isGeneratingRef.current = false;
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, barcodeLoaded, isSettingsLoading, previewUrl]);

  /* ---------- Download ---------- */
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `label-${product.sku}.png`;
    a.click();
  };

  /* ---------- Share ---------- */
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

  /* ---------- Print (Browser Direct) ---------- */
  const handleBrowserPrint = () => {
    if (!previewUrl) return;
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Popup blocked. Please allow popups for printing.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${product.sku}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #ffffff; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { background: none; }
              img { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${previewUrl}" onload="window.print(); setTimeout(() => window.close(), 500);" />
        </body>
      </html>
    `);
    printWin.document.close();
  };

  /* ---------- Print (Native App) Step 1: Open Copies Dialog ---------- */
  const requestNativePrint = () => {
    setCopiesDialogOpen(true);
  };

  /* ---------- Print (Native App) Step 2: Native App / Local API / Job Deep Link ---------- */
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

      const storeName = activeStoreSettings?.storeName || "Bhotiya Fabric Collection";

      const payload = {
        image: cleanB64,
        copies,
        sku: product.sku || "",
        name: product.name || "",
        price: product.price || "",
        storeName,
      };

      // 1️⃣ Attempt direct HTTP POST to local WtsPrinterHelper HTTP listener (if running on port 3377/9100/etc.)
      let sentViaLocalHttp = false;
      const localPorts = [3377, 9100];
      for (const port of localPorts) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);
          const res = await fetch(`http://127.0.0.1:${port}/print`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            sentViaLocalHttp = true;
            console.log(`✅ [Native Label Print] Successfully sent to WtsPrinterHelper local HTTP listener on port ${port}`);
            break;
          }
        } catch {
          /* Local listener not available on this port, continue to fallback */
        }
      }

      if (sentViaLocalHttp) {
        setCopiesDialogOpen(false);
        return;
      }

      // 2️⃣ Fallback to Next.js print job API (/api/print/job) to generate a short jobId for deepLink
      const jobRes = await fetch("/api/print/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        const deepLink = jobData.deepLink || `wts://print?jobId=${jobData.jobId}&copies=${copies}`;

        console.log("🖨️ [Native Label Print Triggered Short Link]", {
          jobId: jobData.jobId,
          deepLink,
          copies,
        });

        // Launch protocol with short URL (never canceled by Chrome URL length limit!)
        window.location.href = deepLink;
      } else {
        // Fallback: If job API fails, use optimized cleanB64 short query or browser print
        handleBrowserPrint();
      }
    } catch (err) {
      console.error("Native print failed:", err);
      // Fallback to browser print dialog
      handleBrowserPrint();
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
                  minPrice={product.minPrice}
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
