"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseBarcode } from "@/lib/scanner";

interface ManualScannerProps {
  onScan: (barcode: string) => void;
}

export function ManualScanner({ onScan }: ManualScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const { toast } = useToast();

  // ---- Auto-detect scanner input ----
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // Reset buffer if typing is slow (human typing)
      if (now - lastKeyTime > 100) buffer = "";
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length > 3) {
          // Looks like a scanned code
          handleAutoScan(buffer);
        }
        buffer = "";
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        buffer += e.key;
      }
    };

    const handleAutoScan = (code: string) => {
      const parsed = parseBarcode(code);
      if (parsed) {
        onScan(parsed);
        toast({
          title: "Barcode Scanned Automatically",
          description: `Code: ${parsed}`,
        });
      } else {
        toast({
          title: "Invalid Barcode",
          description: "Please check your barcode or use manual entry",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, toast]);

  // ---- Manual submit handler ----
  const handleManualSubmit = useCallback(() => {
    const parsed = parseBarcode(manualInput);
    if (parsed) {
      onScan(parsed);
      setManualInput("");
    } else {
      toast({
        title: "Invalid Barcode",
        description: "Please enter a valid barcode number",
        variant: "destructive",
      });
    }
  }, [manualInput, onScan, toast]);

  return (
    <div className="border-t pt-4">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Manual Entry</label>
          <p className="text-xs text-muted-foreground">
            Enter barcode manually or scan using a connected scanner
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter or scan barcode"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            autoFocus
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
