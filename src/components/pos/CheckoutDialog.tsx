"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PosCheckoutPrefs } from "@/lib/pos-checkout-prefs";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  paymentMethod: string;
  prefs: PosCheckoutPrefs;
  onPaymentDone: () => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  total,
  paymentMethod,
  prefs,
  onPaymentDone,
  onCancel,
  isSubmitting,
}: CheckoutDialogProps) {
  const formatIN = (num: number) =>
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const automated = prefs.paymentConfirmMode === "automated";
  const autoSeconds = Math.max(0, prefs.paymentConfirmAutoSeconds);
  const autoButton = prefs.paymentConfirmAutoButton;

  const [countdown, setCountdown] = useState(0);
  /** User already confirmed or cancelled — block duplicate auto-run / double sale. */
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      consumedRef.current = false;
      setCountdown(0);
      return;
    }

    if (prefs.paymentConfirmMode !== "automated") {
      setCountdown(0);
      return;
    }

    consumedRef.current = false;
    setCountdown(autoSeconds);

    const runAuto = async () => {
      if (consumedRef.current) return;
      consumedRef.current = true;
      if (autoButton === "cancel") {
        onCancel();
        return;
      }
      try {
        await onPaymentDone();
      } catch {
        consumedRef.current = false;
      }
    };

    if (autoSeconds === 0) {
      const raf = requestAnimationFrame(() => {
        void runAuto();
      });
      return () => cancelAnimationFrame(raf);
    }

    let left = autoSeconds;
    const id = window.setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0) {
        window.clearInterval(id);
        void runAuto();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [
    open,
    prefs.paymentConfirmMode,
    autoSeconds,
    autoButton,
    onCancel,
    onPaymentDone,
  ]);

  const handleManualPaymentDone = async () => {
    consumedRef.current = true;
    try {
      await onPaymentDone();
    } catch {
      /* Keep consumed true so the countdown cannot fire a duplicate submit. */
    }
  };

  const handleCancel = () => {
    consumedRef.current = true;
    onCancel();
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next && isSubmitting) return;
    if (!next) onCancel();
    onOpenChange(next);
  };

  const showPaymentCountdown =
    automated && autoButton === "payment_done" && autoSeconds > 0;
  const showCancelCountdown =
    automated && autoButton === "cancel" && autoSeconds > 0;

  const labelPaymentDone =
    showPaymentCountdown && !isSubmitting
      ? `Payment done (${countdown}s)`
      : "Payment done";

  const labelCancel =
    showCancelCountdown && !isSubmitting
      ? `Cancel (${countdown}s)`
      : "Cancel";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Please confirm the payment of{" "}
          <strong>₹{formatIN(total)}</strong> via{" "}
          <strong>{paymentMethod.toUpperCase()}</strong> is completed.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {labelCancel}
          </Button>
          <Button onClick={handleManualPaymentDone} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving sale…
              </>
            ) : (
              labelPaymentDone
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
