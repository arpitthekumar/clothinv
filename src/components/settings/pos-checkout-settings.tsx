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
  applyPreset,
  type PaymentConfirmButtonId,
  type PaymentConfirmMode,
  type PosCheckoutPrefs,
  type PresetMode,
  type ThankYouButtonId,
  type ThankYouMode,
} from "@/lib/pos-checkout-prefs";
import { useToast } from "@/hooks/use-toast";
import { Zap, CreditCard, XCircle, Send, Printer, Image, FileText, DoorOpen, Volume2, VolumeX, Tag, Percent, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AllowedDiscountModes, DefaultDiscountType } from "@/lib/pos-checkout-prefs";

const allowedDiscountOptions: { value: AllowedDiscountModes; label: string; description: string }[] = [
  { value: "all", label: "All Discount Options", description: "Allow Percentage (%), Fixed Amount (₹), and Coupon Codes" },
  { value: "coupon_only", label: "Coupon Code Only", description: "Only allow discount via promotional coupon codes" },
  { value: "percentage_only", label: "Percentage Discount Only (%)", description: "Only allow percentage-based discount" },
  { value: "fixed_only", label: "Fixed Amount Only (₹)", description: "Only allow flat amount discount" },
  { value: "percentage_and_coupon", label: "Percentage (%) & Coupon Code", description: "Allow percentage (%) and coupon code options" },
];

const defaultDiscountTypeOptions: { value: DefaultDiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage Discount (%)" },
  { value: "fixed", label: "Fixed Amount (₹)" },
  { value: "coupon", label: "Coupon Code" },
];

function isDiscountTypeAllowed(type: DefaultDiscountType, mode: AllowedDiscountModes): boolean {
  if (mode === "all") return true;
  if (mode === "coupon_only") return type === "coupon";
  if (mode === "percentage_only") return type === "percentage";
  if (mode === "fixed_only") return type === "fixed";
  if (mode === "percentage_and_coupon") return type === "percentage" || type === "coupon";
  return true;
}

function getFallbackTypeForMode(mode: AllowedDiscountModes): DefaultDiscountType {
  if (mode === "coupon_only") return "coupon";
  if (mode === "percentage_only") return "percentage";
  if (mode === "fixed_only") return "fixed";
  if (mode === "percentage_and_coupon") return "percentage";
  return "percentage";
}

const paymentModes: { value: PaymentConfirmMode; label: string }[] = [
  { value: "manual", label: "Manual — confirm sale after you tap Payment done" },
  {
    value: "automated",
    label: "Automated — timer + auto-tap one of the dialog buttons",
  },
  { value: "none", label: "No confirmation — skip dialog and create sale immediately" },
];

const thankYouModes: { value: ThankYouMode; label: string }[] = [
  { value: "manual", label: "Manual — no automation on receipt screen" },
  {
    value: "automated",
    label: "Automated — timer + auto-tap one receipt action",
  },
];

const presetModes: { value: PresetMode; label: string; description: string }[] = [
  { value: "fast", label: "Fast", description: "No confirmation, auto-close receipt after 1s" },
  { value: "safe", label: "Safe", description: "Manual confirmation, manual receipt actions" },
  { value: "balanced", label: "Balanced", description: "Auto-confirm after 3s, auto-print receipt after 2s" },
  { value: "custom", label: "Custom", description: "Configure each setting manually" },
];

const paymentButtons: {
  id: PaymentConfirmButtonId;
  label: string;
  icon: typeof CreditCard | typeof XCircle;
}[] = [
  { id: "payment_done", label: "Payment done", icon: CreditCard },
  { id: "cancel", label: "Cancel", icon: XCircle },
];

const thankYouButtons: {
  id: ThankYouButtonId;
  label: string;
  icon: typeof Send | typeof Printer | typeof Image | typeof FileText | typeof DoorOpen;
}[] = [
  { id: "whatsapp", label: "WhatsApp", icon: Send },
  { id: "fast_print", label: "Fast print", icon: Printer },
  { id: "image", label: "Image (generate PNG)", icon: Image },
  { id: "pdf", label: "PDF (generate)", icon: FileText },
  { id: "close", label: "Close receipt", icon: DoorOpen },
];

export function PosCheckoutSettings() {
  const [prefs, setPrefs] = useState<PosCheckoutPrefs>(DEFAULT_POS_CHECKOUT_PREFS);
  const { toast } = useToast();

  useEffect(() => {
    setPrefs(getPosCheckoutPrefs());
  }, []);

  const update = <K extends keyof PosCheckoutPrefs>(key: K, value: PosCheckoutPrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value, preset: key === 'preset' ? value as PresetMode : 'custom' }));
  };

  const handleSelectAllowedMode = (newMode: AllowedDiscountModes) => {
    let nextType = prefs.defaultDiscountType;
    let didAdjust = false;

    if (prefs.defaultDiscountEnabled && !isDiscountTypeAllowed(prefs.defaultDiscountType, newMode)) {
      nextType = getFallbackTypeForMode(newMode);
      didAdjust = true;
    }

    setPrefs((prev) => ({
      ...prev,
      allowedDiscountModes: newMode,
      defaultDiscountType: nextType,
      preset: "custom",
    }));

    if (didAdjust) {
      toast({
        title: "Default Discount Adjusted",
        description: `Default discount type auto-switched to match allowed POS mode (${newMode}).`,
      });
    }
  };

  const handleSelectDefaultType = (newType: DefaultDiscountType) => {
    let nextMode = prefs.allowedDiscountModes || "all";
    let didExpand = false;

    if (!isDiscountTypeAllowed(newType, nextMode)) {
      if (newType === "coupon" && nextMode === "percentage_only") {
        nextMode = "percentage_and_coupon";
      } else {
        nextMode = "all";
      }
      didExpand = true;
    }

    setPrefs((prev) => ({
      ...prev,
      defaultDiscountType: newType,
      allowedDiscountModes: nextMode,
      preset: "custom",
    }));

    if (didExpand) {
      toast({
        title: "Allowed Modes Expanded",
        description: `POS allowed modes updated to support ${newType === "percentage" ? "Percentage" : newType === "fixed" ? "Fixed Amount" : "Coupon Code"}.`,
      });
    }
  };

  const save = () => {
    setPosCheckoutPrefs(prefs);
    toast({
      title: "Settings saved",
      description: "Your POS checkout & discount preferences have been saved successfully.",
    });
  };

  const reset = () => {
    setPrefs(DEFAULT_POS_CHECKOUT_PREFS);
    setPosCheckoutPrefs(DEFAULT_POS_CHECKOUT_PREFS);
  };

  const applyPresetMode = (preset: PresetMode) => {
    const newPrefs = applyPreset(preset);
    setPrefs(newPrefs);
  };

  const isCurrentDefaultTypeValid = isDiscountTypeAllowed(
    prefs.defaultDiscountType || "percentage",
    prefs.allowedDiscountModes || "all"
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Choose a preset for common workflows</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetModes.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyPresetMode(p.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                    prefs.preset === p.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CART DISCOUNTS & DEFAULT PRESET CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Cart Discounts & Default Preset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allowed Discount Modes */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Allowed Discount Modes in POS Checkout</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controls which discount options cashier/user sees during POS checkout.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {allowedDiscountOptions.map((opt) => {
                const isSelected = (prefs.allowedDiscountModes || "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectAllowedMode(opt.value)}
                    className={cn(
                      "flex flex-col justify-between gap-1.5 rounded-xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                        : "border-border hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm leading-snug">{opt.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Automatic Default Cart Discount Toggle */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
              <div className="space-y-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  Default Cart Discount Preset
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically pre-fill a default discount on every new cart (can still be cleared manually).
                </p>
              </div>
              <Button
                variant={prefs.defaultDiscountEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => update("defaultDiscountEnabled", !prefs.defaultDiscountEnabled)}
                className={`font-semibold shrink-0 gap-1.5 transition-all ${
                  prefs.defaultDiscountEnabled
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-border hover:bg-muted"
                }`}
              >
                {prefs.defaultDiscountEnabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Default Discount ON
                  </>
                ) : (
                  "Default Discount OFF"
                )}
              </Button>
            </div>

            {prefs.defaultDiscountEnabled && (
              <div className="p-4 rounded-xl bg-card border shadow-xs space-y-4">
                {!isCurrentDefaultTypeValid && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      <strong>Warning:</strong> Selected default discount type (<strong>{prefs.defaultDiscountType}</strong>) is currently restricted by Allowed Discount Modes (<strong>{prefs.allowedDiscountModes}</strong>). Selecting a type will automatically expand allowed modes.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Discount Type</Label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-lg text-xs font-medium">
                      {defaultDiscountTypeOptions.map((opt) => {
                        const isSelected = prefs.defaultDiscountType === opt.value;
                        const isAllowed = isDiscountTypeAllowed(opt.value, prefs.allowedDiscountModes || "all");
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelectDefaultType(opt.value)}
                            className={`py-2 px-2 rounded-md transition-all text-center flex items-center justify-center gap-1 ${
                              isSelected
                                ? "bg-background text-foreground shadow-xs font-semibold ring-1 ring-primary/30"
                                : isAllowed
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-muted-foreground/70 hover:text-foreground opacity-90"
                            }`}
                          >
                            <span>{opt.value === "percentage" ? "% Percent" : opt.value === "fixed" ? "₹ Fixed" : "Coupon"}</span>
                            {!isAllowed && <span className="text-[10px] text-amber-500 font-bold" title="Clicking will expand allowed POS modes">⚡</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {prefs.defaultDiscountType === "coupon"
                        ? "Default Coupon Code"
                        : prefs.defaultDiscountType === "percentage"
                        ? "Default Percentage (%)"
                        : "Default Fixed Amount (₹)"}
                    </Label>
                    <div className="relative">
                      {prefs.defaultDiscountType === "fixed" && (
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">₹</span>
                      )}
                      <Input
                        type={prefs.defaultDiscountType === "coupon" ? "text" : "number"}
                        placeholder={
                          prefs.defaultDiscountType === "coupon"
                            ? "e.g. WELCOME10"
                            : prefs.defaultDiscountType === "percentage"
                            ? "e.g. 10"
                            : "e.g. 100"
                        }
                        value={prefs.defaultDiscountValue || ""}
                        onChange={(e) => update("defaultDiscountValue", e.target.value)}
                        className={prefs.defaultDiscountType === "fixed" ? "pl-7" : ""}
                      />
                      {prefs.defaultDiscountType === "percentage" && (
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <span>💡</span> Every new cart will start with this discount pre-applied. Cashiers can clear it with 1-click.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      {(prefs.paymentConfirmMode === "automated" || prefs.thankYouMode === "automated") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Sound Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Play sound before automation</Label>
                <p className="text-sm text-muted-foreground">
                  Plays a beep sound just before automated actions run
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => update("soundEnabled", !prefs.soundEnabled)}
                className="flex items-center gap-2"
              >
                {prefs.soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Sound On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Sound Off
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {prefs.preset === "custom" && (
        <>
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
        </>
      )}

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
