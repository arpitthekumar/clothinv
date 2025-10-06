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

export const ProductLabel = React.forwardRef<HTMLDivElement, ProductLabelProps>(
  ({ name, sku, price, size, categoryName, code, className }, ref) => {
    const barcodeUrl = getBarcodeUrl(code);

    return (
      <div
        ref={ref}
        className={"border-2 p-4 w-[300px] text-center bg-white " + (className || "")}
        style={{
          fontFamily: "Arial, sans-serif",
          color: "#1f2937", // text-gray-800 replacement
          borderColor: "#000000",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <h1 style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px", color: "#111827" }}>
          WTS cloths
        </h1>

        {/* Product Name */}
        <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{name}</div>

        {/* SKU */}
        <div style={{ fontSize: "12px", marginBottom: "8px", color: "#4b5563" }}>SKU: {sku}</div>

        {/* Barcode */}
        <div style={{ margin: "8px 0", display: "flex", justifyContent: "center" }}>
          <img src={barcodeUrl} alt="Barcode" crossOrigin="anonymous" />
        </div>

        {/* Barcode Text */}
        <div style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>
          {code}
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "12px", textAlign: "left" }}>
          <div>
            <span style={{ color: "#111827", fontWeight: 500 }}>Price:</span>{" "}
            <span style={{ fontWeight: 600 }}>{price !== undefined ? `₹${price}` : "-"}</span>
          </div>
          <div>
            <span style={{ color: "#111827", fontWeight: 500 }}>Size:</span>{" "}
            <span style={{ fontWeight: 600 }}>{size || "-"}</span>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <span style={{ color: "#6b7280", fontWeight: 500 }}>Category:</span>{" "}
            <span style={{ fontWeight: 600 }}>{categoryName || "-"}</span>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <span style={{ color: "#6b7280", fontWeight: 500 }}>SKU:</span>{" "}
            <span style={{ fontWeight: 600 }}>{sku}</span>
          </div>
        </div>
      </div>
    );
  }
);

ProductLabel.displayName = "ProductLabel";
