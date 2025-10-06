"use client";

import React from "react";

type ProductLabelProps = {
  name: string;
  sku: string;
  price?: string | number;
  size?: string | null;
  categoryName?: string | null;
  code: string; // barcode or fallback code text
  className?: string;
};

function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const isEanCandidate = /^\d{12,13}$/.test(value);
  const symbology = isEanCandidate ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=3&includetext=true&guardwhitespace=true`;
}

export function buildBarcodeUrl(value: string): string {
  return getBarcodeUrl(value);
}

export const ProductLabel = React.forwardRef<HTMLDivElement, ProductLabelProps>(
  ({ name, sku, price, size, categoryName, code, className }, ref) => {
    const barcodeUrl = getBarcodeUrl(code);
    return (
      <div
        ref={ref}
        className={
          "border-2 border-black p-4 w-[300px] text-center text-gray-800 bg-white " + (className || "")
        }
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <h1 className="text-gray-900 text-[16px] font-bold mb-1">WTS cloths</h1>
        <div className="text-[16px] font-bold mb-1">{name}</div>
        <div className="text-[12px] mb-2 text-gray-700">SKU: {sku}</div>
        <div className="my-2 flex items-center justify-center">
          <img src={barcodeUrl} alt="Barcode" crossOrigin="anonymous" />
        </div>
        <div className="font-mono text-[11px] tracking-[2px] mb-2">{code}</div>
        <div className="grid grid-cols-2 gap-1 text-left text-[12px] leading-tight">
          <div><span className="text-gray-900">Price:</span> <span className="font-semibold">{price !== undefined ? `₹${price}` : '-'}</span></div>
          <div><span className="text-gray-900">Size:</span> <span className="font-semibold">{size || '-'}</span></div>
          <div className="col-span-2"><span className="text-gray-600">Category:</span> <span className="font-semibold">{categoryName || '-'}</span></div>
          <div className="col-span-2"><span className="text-gray-600">SKU:</span> <span className="font-semibold">{sku}</span></div>
        </div>
      </div>
    );
  }
);

ProductLabel.displayName = "ProductLabel";


