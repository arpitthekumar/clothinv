"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_POS_CHECKOUT_PREFS,
  getPosCheckoutPrefs,
  setPosCheckoutPrefs,
  type PaymentConfirmButtonId,
  type PaymentConfirmMode,
  type PosCheckoutPrefs,
  type ThankYouButtonId,
  type ThankYouMode,
} from "@/lib/pos-checkout-prefs";
import { Zap, CreditCard, XCircle, Send, Printer, Image, FileText, DoorOpen } from "lucide-react";

const paymentModes: { value: PaymentConfirmMode; label: string }[] = [
  { value: "manual", label: "Manual — confirm sale after you tap Payment done" },
  {
    value: "automated",
    label: "Automated — timer + auto-tap one of the dialog buttons",
  },
  { value: "none", label: "No confirmation — create sale as soon as you tap Pay" },
];

const thankYouModes: { value: ThankYouMode; label: string }[] = [
  { value: "manual", label: "Manual — no automation on receipt screen" },
  {
    value: "automated",
    label: "Automated — timer + auto-tap one receipt action",
  },
];

const paymentButtons: {
  id: PaymentConfirmButtonId;
  label: string;
  icon: typeof CreditCard;
}[] = [
  { id: "payment_done", label: "Payment done", icon: CreditCard },
  { id: "cancel", label: "Cancel", icon: XCircle },
];

const thankYouButtons: {
  id: ThankYouButtonId;
  label: string;
  icon: typeof Send;
}[] = [
  { id: "whatsapp", label: "WhatsApp", icon: Send },
  { id: "fast_print", label: "Fast print", icon: Printer },
  { id: "image", label: "Image (generate PNG)", icon: Image },
  { id: "pdf", label: "PDF (generate)", icon: FileText },
  { id: "close", label: "Close receipt", icon: DoorOpen },
];

export function PosCheckoutSettings() {
  const [prefs, setPrefs] = useState<PosCheckoutPrefs>(DEFAULT_POS_CHECKOUT_PREFS);

  useEffect(() => {
    setPrefs(getPosCheckoutPrefs());
  }, []);

  const update = <K extends keyof PosCheckoutPrefs>(key: K, value: PosCheckoutPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const save = () => {
    setPosCheckoutPrefs(prefs);
  };

  const reset = () => {
    setPrefs(DEFAULT_POS_CHECKOUT_PREFS);
    setPosCheckoutPrefs(DEFAULT_POS_CHECKOUT_PREFS);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Payment confirmation (POS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={prefs.paymentConfirmMode}
              onValueChange={(v) => update("paymentConfirmMode", v as PaymentConfirmMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {prefs.paymentConfirmMode === "automated" && (
            <>
              <div className="space-y-2">
                <Label>Timer (seconds)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={prefs.paymentConfirmAutoSeconds}
                  onChange={(e) =>
                    update(
                      "paymentConfirmAutoSeconds",
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use 0 for instant action when the dialog opens (no countdown).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Button to automate</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {paymentButtons.map((b) => {
                    const Icon = b.icon;
                    const isSel = prefs.paymentConfirmAutoButton === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => update("paymentConfirmAutoButton", b.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          isSel
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:bg-muted/60",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Thank you / receipt (POS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={prefs.thankYouMode}
              onValueChange={(v) => update("thankYouMode", v as ThankYouMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {thankYouModes.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {prefs.thankYouMode === "automated" && (
            <>
              <div className="space-y-2">
                <Label>Timer (seconds)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={prefs.thankYouAutoSeconds}
                  onChange={(e) =>
                    update(
                      "thankYouAutoSeconds",
                      Math.max(0, Math.floor(Number(e.target.value) || 0)),
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use 0 to run the chosen action immediately when the receipt opens.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Button to automate</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {thankYouButtons.map((b) => {
                    const Icon = b.icon;
                    const isSel = prefs.thankYouAutoButton === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => update("thankYouAutoButton", b.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          isSel
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:bg-muted/60",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="font-medium text-sm leading-snug">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save}>
          Save settings
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Reset to defaults
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Stored in this browser only (localStorage). Each device can use different
        checkout speed.
      </p>
    </div>
  );
}
