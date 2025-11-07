// /src/components/shared/barcode-generator.tsx
"use client";

import React, { FC, memo } from "react";
import Barcode from "react-barcode";

interface BarcodeGeneratorProps {
  value: string;
  width?: number;      // optional, default 2
  height?: number;     // optional, default 50
  displayValue?: boolean; // optional, default true
  className?: string;  // optional styling
}

const BarcodeGenerator: FC<BarcodeGeneratorProps> = memo(
  ({ value, width = 2, height = 70, displayValue = true, className }) => {
    const trimmedValue = (value || "").trim();
    const isEanCandidate = /^\d{12,13}$/.test(trimmedValue);
    const format = isEanCandidate ? "EAN13" : "CODE128";

    return (
      <Barcode
        value={trimmedValue || "000000"}
        format={format}
        width={width}
        height={height}
        displayValue={displayValue}
        className={className}
      />
    );
  }
);

BarcodeGenerator.displayName = "BarcodeGenerator";
export default BarcodeGenerator;
