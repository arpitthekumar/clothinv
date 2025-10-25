"use client";

import React from "react";

type ProductLabelProps = {
  name: string;
  sku: string;
  price: string | number;
  size: string;
  categoryName: string;
  code: string;
  className?: string;
  onBarcodeLoad?: () => void;
};

function getBarcodeUrl(payload: string): string {
  const value = (payload || "").trim();
  const isEanCandidate = /^\d{12,13}$/.test(value);
  const symbology = isEanCandidate ? "ean13" : "code128";
  return `https://bwipjs-api.metafloor.com/?bcid=${symbology}&text=${encodeURIComponent(
    value
  )}&scale=4&includetext=true&guardwhitespace=true&backgroundcolor=ffffff&fmt=svg`;
}

export const ProductLabel = React.forwardRef<HTMLDivElement, ProductLabelProps>(
  ({ sku, price, size, categoryName, code, className, onBarcodeLoad }, ref) => {
    const barcodeUrl = getBarcodeUrl(code);

    return (
      <div
        ref={ref}
        aria-describedby={undefined}
        className={`relative flex flex-col justify-between border border-black bg-white text-black p-1 w-[380px] h-[200px] ${
          className || ""
        }`}
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div>
          {/* Top Title */}
          <h1 className="text-[28px] font-bold text-center">
            Bhootia Fabric Collection
          </h1>

          <div className="flex flex-row text-[20px] font-semibold px-4">
            <div className="flex flex-col">
              <p className="flex flex-row">
                Price: <span>{" "}{price}</span>
              </p>
              <p className="flex flex-row ">
                SIZE: <span>{size}</span>
              </p>
              <p className="flex flex-row">
                CT: <span>{categoryName}</span>
              </p>
              <div className="text-left text-[28px] font-extrabold">WTS</div>
            </div>

            {/* Barcode */}
            <div className="items-center ml-auto">
              <p className="text-[20px] font-semibold text-center pb-2">
                SKU: {sku}
              </p>
              <div className="flex justify-center">
                <img
                  src={barcodeUrl}
                  alt="Barcode"
                  crossOrigin="anonymous"
                  className="w-[280px] h-[100px] object-cover object-bottom overflow-hidden"
                  onLoad={onBarcodeLoad}
                  onError={onBarcodeLoad}
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
