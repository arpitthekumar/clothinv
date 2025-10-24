"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseBarcode } from "@/lib/scanner";
import { Card } from "../ui/card";

interface ManualScannerProps {
  onScan: (barcode: string) => void;
}

export function ManualScanner({ onScan }: ManualScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const { toast } = useToast();

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
    <Card className="border p-4  items-center">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Manual Entry</label>
          <p className="text-xs text-muted-foreground">
            Enter barcode number if camera scanning fails
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter barcode number"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
          >
            Submit
          </Button>
        </div>
      </div>
    </Card>
  );
}
