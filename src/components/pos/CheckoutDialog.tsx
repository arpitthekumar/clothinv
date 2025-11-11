"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  paymentMethod: string;
  onConfirm: () => void;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  total,
  paymentMethod,
  onConfirm,
}: CheckoutDialogProps) {
  // ✅ Format total using Indian comma system (no decimals)
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Please confirm the payment of{" "}
          <strong>₹{formatIN(total)}</strong> via{" "}
          <strong>{paymentMethod.toUpperCase()}</strong> is completed.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Payment Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
