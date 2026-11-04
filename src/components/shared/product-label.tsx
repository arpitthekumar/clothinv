"use client";

import React from "react";
import { useStoreSettings } from "@/hooks/use-store-settings";

type ProductLabelProps = {
  name: string;
  sku: string;
  price: string | number;      // Product Price / MRP
  minPrice?: string | number; // Minimum / Offer Price
  size: string;
  categoryName: string;
  code: string;
  storeName?: string;
  className?: string;
  onBarcodeLoad?: () => void;
};

function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === digits[12];
}

function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const symbology = isValidEan13(value) ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=4&includetext=true&guardwhitespace=true&backgroundcolor=ffffff&fmt=svg`;
}

export const ProductLabel = React.forwardRef<HTMLDivElement, ProductLabelProps>(
  ({ sku, price, minPrice, size, categoryName, code, storeName: customStoreName, className, onBarcodeLoad }, ref) => {
    const { settings, isLoading } = useStoreSettings();
    const displayStoreName = customStoreName || settings?.storeName || "Bhotiya Fabric Collection";
    
    const initialBarcodeUrl = getBarcodeUrl(code);
    const [barcodeSrc, setBarcodeSrc] = React.useState<string>(initialBarcodeUrl);

    React.useEffect(() => {
      setBarcodeSrc(getBarcodeUrl(code));
    }, [code]);

    const handleImgError = () => {
      const fallbackUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(
        (code || "").trim()
      )}&scale=4&includetext=true&guardwhitespace=true&backgroundcolor=ffffff&fmt=svg`;
      
      if (barcodeSrc !== fallbackUrl) {
        setBarcodeSrc(fallbackUrl);
      } else {
        onBarcodeLoad?.();
      }
    };

    const mrpVal = price ? String(price).trim() : "";
    const offerVal = minPrice ? String(minPrice).trim() : "";
    const hasOffer = Boolean(
      offerVal &&
      mrpVal &&
      offerVal !== mrpVal &&
      Number(offerVal) < Number(mrpVal)
    );

    return (
      <div
        ref={ref}
        data-product-label="true"
        aria-describedby={undefined}
        className={`relative flex flex-col justify-between border border-black p-1 w-[380px] h-[200px] ${className || ""}`}
        style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#ffffff", color: "#000000" }}
      >
        <div>
          {/* Top Title */}
          <h1
            className="text-[24px] font-bold text-center leading-normal truncate px-1 py-1"
            style={{ color: "#000000" }}
          >
            {isLoading && !customStoreName ? (
              <span
                className="inline-block w-48 h-6 animate-pulse rounded"
                style={{ backgroundColor: "#e5e7eb" }}
              />
            ) : (
              displayStoreName
            )}
          </h1>

          <div className="flex flex-row text-[20px] font-semibold px-4" style={{ color: "#000000" }}>
            <div className="flex flex-col gap-0.5">
              {hasOffer ? (
                <>
                  <p className="flex flex-row text-[13px] leading-tight" style={{ color: "#000000" }}>
                    MRP: <span className="font-normal line-through ml-1" style={{ color: "#555555" }}>₹{mrpVal}</span>
                    <span className="font-extrabold ml-1" style={{ color: "#000000" }}>₹{offerVal}</span>
                  </p>
                  <p className="flex flex-row text-[15px] font-bold leading-tight" style={{ color: "#000000" }}>
                  </p>
                </>
              ) : (
                <p className="flex flex-row text-[15px] font-bold" style={{ color: "#000000" }}>
                  MRP: <span className="font-extrabold ml-1" style={{ color: "#000000" }}>₹{mrpVal}</span>
                </p>
              )}
              <p className="flex flex-row text-[13px]" style={{ color: "#000000" }}>
                SIZE: <span className="font-normal ml-1" style={{ color: "#000000" }}>{size}</span>
              </p>
              <p className="flex flex-row text-[14px]" style={{ color: "#000000" }}>
                CT: <span className="font-normal ml-1" style={{ color: "#000000" }}>{categoryName}</span>
              </p>
              <div className="text-left text-[24px] font-extrabold mt-0.5" style={{ color: "#000000" }}>
                WTS
              </div>
            </div>

            {/* Barcode */}
            <div className="items-center ml-auto" style={{ color: "#000000" }}>
              <p className="text-[18px] font-semibold text-center pb-1" style={{ color: "#000000" }}>
                SKU: {sku}
              </p>
              <div className="flex justify-center">
                <img
                  src={barcodeSrc}
                  alt="Barcode"
                  crossOrigin="anonymous"
                  className="w-[280px] h-[100px] object-cover object-bottom overflow-hidden"
                  onLoad={onBarcodeLoad}
                  onError={handleImgError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProductLabel.displayName = "ProductLabel";