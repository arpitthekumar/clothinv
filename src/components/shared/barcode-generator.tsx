"use client";

import React, { FC, memo, useEffect, useRef } from "react";
import Barcode from "react-barcode";

interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
  onBase64?: (base64: string) => void; // send base64
}

const BarcodeGenerator: FC<BarcodeGeneratorProps> = memo(
  ({ value, width = 2, height = 70, displayValue = true, className, onBase64 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Wait for barcode to render
      setTimeout(() => {
        const canvas = containerRef.current?.querySelector("canvas");
        if (!canvas) return;

        try {
          const base64 = canvas.toDataURL("image/png");
          onBase64?.(base64);
        } catch (e) {
          console.error("Barcode Base64 extraction failed:", e);
        }
      }, 100);
    }, [value]);

    return (
      <div ref={containerRef}>
        <Barcode
          value={value || "000000"}
          width={width}
          height={height}
          displayValue={displayValue}
          renderer="canvas"
          className={className}
        />
      </div>
    );
  }
);

BarcodeGenerator.displayName = "BarcodeGenerator";
export default BarcodeGenerator;
