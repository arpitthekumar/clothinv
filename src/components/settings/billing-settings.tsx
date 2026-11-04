"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { DEFAULT_STORE_SETTINGS, DEFAULT_WHATSAPP_TEMPLATE, type StoreSettings } from "@/types/store-settings";
import LabelBill from "@/components/pos/LabelBill";
import { invoicePrinter, type InvoiceData } from "@/lib/printer";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Printer,
  CheckCircle2,
  RefreshCw,
  Percent,
  ShieldCheck,
  Send,
  Zap,
  Lock,
  Instagram,
  MessageCircle,
  UserCheck,
} from "lucide-react";

export function BillingSettings() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings, isUpdating } = useStoreSettings();
  const [formData, setFormData] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const { toast } = useToast();

  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.username?.trim().toLowerCase() === "admin" || user.id === "admin-dev-001")
  );

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_STORE_SETTINGS);
    toast({
      title: "Reset to Defaults",
      description: "Form reset to default Bhotiya Fabric Collection details. Click Save to apply.",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone) {
      const cleanDigits = formData.phone.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        toast({
          title: "Invalid Store Phone Number",
          description: "Store phone number must be a valid 10-digit number.",
          variant: "destructive",
        });
        return;
      }
    }
    try {
      await updateSettings(formData);
      toast({
        title: "Settings Saved",
        description: "Store & Billing details updated successfully in Supabase database",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to update store billing settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        Loading Store Billing Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center text-lg gap-2">
                <Store className="h-5 w-5 text-primary" />
                Store & Billing Details
              </CardTitle>
              <CardDescription>
                Customize store name, address, phone number, GST, and receipt footers for thermal invoices and labels.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled={!isSuperAdmin}
                onClick={handleResetDefaults}
                type="button"
                className="h-8 text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Defaults
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* EDIT FORM (7 columns) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave}>
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Store Identity & Receipt Header Information
                  </CardTitle>
                  {!isSuperAdmin && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 inline-flex items-center font-normal">
                      <Lock className="h-3 w-3" />
                      Super Admin Only
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  All thermal invoices, WhatsApp receipts, and label bills will fetch these values from Supabase.
                </CardDescription>
              </CardHeader>

              {!isSuperAdmin && (
                <div className="mx-6 mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <strong className="font-semibold">Access Restricted:</strong> This form is locked in Read-Only mode. Only Super Admin users can modify store identity, tax settings, receipt footers, and WhatsApp templates.
                  </div>
                </div>
              )}

              <CardContent className="space-y-4">
                {/* Store Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="storeName" className="text-xs font-semibold flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    Store / Business Name *
                  </Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("storeName", e.target.value)}
                    placeholder="e.g. Bhotiya Fabric Collection"
                    className="h-9 text-sm"
                    maxLength={35}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Default: <strong>Bhotiya Fabric Collection</strong> (max 35 chars)
                  </p>
                </div>

                {/* Tagline / Subtitle */}
                <div className="space-y-1.5">
                  <Label htmlFor="tagline" className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Tagline / Subtitle
                  </Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="e.g. Quality Fabrics & Clothing"
                    maxLength={50}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Store Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="e.g. Moti Ganj, Bakebar Road, Bharthana"
                    rows={2}
                    maxLength={100}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        Phone Number
                      </Label>
                      {formData.phone.trim().length > 0 && (
                        <span className={`text-xs font-mono font-medium ${formData.phone.replace(/\D/g, "").length === 10 ? "text-emerald-500" : "text-amber-500"}`}>
                          {formData.phone.replace(/\D/g, "").length === 10
                            ? "✓ 10/10 digits"
                            : `${formData.phone.replace(/\D/g, "").length}/10 digits`}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center border rounded-md overflow-hidden transition-colors ${
                        formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10
                          ? "border-destructive ring-1 ring-destructive"
                          : ""
                      }`}
                    >
                      <span className="px-3 text-muted-foreground bg-muted border-r border-border font-medium text-xs">+91</span>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        disabled={!isSuperAdmin}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/\D/g, "");
                          if (raw.length === 12 && raw.startsWith("91")) {
                            raw = raw.slice(2);
                          }
                          const cleaned = raw.slice(0, 10);
                          handleChange("phone", cleaned);
                        }}
                        placeholder="10-digit Phone number"
                        maxLength={10}
                        className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide h-9 text-sm"
                      />
                    </div>
                    {formData.phone.trim().length > 0 && formData.phone.replace(/\D/g, "").length !== 10 && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span>⚠️</span> Must be a valid 10-digit number.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      disabled={!isSuperAdmin}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="e.g. contact@bhotiyafabric.com"
                      maxLength={45}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Instagram & WhatsApp Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="instagram" className="text-xs font-semibold flex items-center gap-1.5">
                      <Instagram className="h-3.5 w-3.5 text-pink-500" />
                      Instagram Handle / Link (Optional)
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.instagram || ""}
                      disabled={!isSuperAdmin}
                      onChange={(e) => handleChange("instagram", e.target.value)}
                      placeholder="e.g. @ankit_jeans_collection"
                      maxLength={50}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsappNumber" className="text-xs font-semibold flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                        WhatsApp Contact Number (Optional)
                      </Label>
                      {formData.whatsappNumber && formData.whatsappNumber.trim().length > 0 && (
                        <span className={`text-xs font-mono font-medium ${formData.whatsappNumber.replace(/\D/g, "").length === 10 ? "text-emerald-500" : "text-amber-500"}`}>
                          {formData.whatsappNumber.replace(/\D/g, "").length === 10
                            ? "✓ 10/10 digits"
                            : `${formData.whatsappNumber.replace(/\D/g, "").length}/10 digits`}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center border rounded-md overflow-hidden transition-colors ${
                        formData.whatsappNumber && formData.whatsappNumber.trim().length > 0 && formData.whatsappNumber.replace(/\D/g, "").length !== 10
                          ? "border-destructive ring-1 ring-destructive"
                          : ""
                      }`}
                    >
                      <span className="px-3 text-muted-foreground bg-muted border-r border-border font-medium text-xs">+91</span>
                      <Input
                        id="whatsappNumber"
                        type="tel"
                        value={formData.whatsappNumber || ""}
                        disabled={!isSuperAdmin}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/\D/g, "");
                          if (raw.length === 12 && raw.startsWith("91")) {
                            raw = raw.slice(2);
                          }
                          const cleaned = raw.slice(0, 10);
                          handleChange("whatsappNumber", cleaned);
                        }}
                        placeholder="10-digit Phone number"
                        maxLength={10}
                        className="border-0 focus:ring-0 focus:outline-none flex-1 font-mono tracking-wide h-9 text-sm"
                      />
                    </div>
                    {formData.whatsappNumber && formData.whatsappNumber.trim().length > 0 && formData.whatsappNumber.replace(/\D/g, "").length !== 10 && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span>⚠️</span> Must be a valid 10-digit number.
                      </p>
                    )}
                  </div>
                </div>

                {/* GST Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="gstNumber" className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    GSTIN / Registration Number (Optional)
                  </Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("gstNumber", e.target.value)}
                    placeholder="e.g. 09AAAAA0000A1Z5"
                    maxLength={20}
                    className="h-9 text-sm font-mono"
                  />
                </div>

                {/* TAX / GST CONFIGURATION CARD */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                        <Percent className="h-4 w-4 text-primary" />
                        Enable GST / Tax Calculation
                        {!isSuperAdmin && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 inline-flex items-center font-normal">
                            <Lock className="h-3 w-3" />
                            Super Admin Only
                          </Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically apply tax percentage during POS checkout and invoice generation.
                        {!isSuperAdmin && <span className="block text-amber-600 dark:text-amber-400 font-medium text-[11px] mt-0.5">Only Super Admin can modify GST/Tax settings.</span>}
                      </p>
                    </div>
                    <Switch
                      checked={formData.taxEnabled}
                      disabled={!isSuperAdmin}
                      onCheckedChange={(val) => setFormData((prev) => ({ ...prev, taxEnabled: val }))}
                    />
                  </div>

                  {formData.taxEnabled && (
                    <div className="space-y-4 pt-2 border-t border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="taxPercent" className="text-xs font-semibold">
                            Tax Rate Percentage (%)
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              id="taxPercent"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.taxPercent}
                              disabled={!isSuperAdmin}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, taxPercent: parseFloat(e.target.value) || 0 }))
                              }
                              placeholder="18"
                              className="h-9 text-sm bg-background font-mono"
                            />
                            <span className="text-xs font-semibold text-muted-foreground">%</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Common rates: 5%, 12%, 18%, 28%
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="taxLabel" className="text-xs font-semibold">
                            Tax Label / Display Name
                          </Label>
                          <Input
                            id="taxLabel"
                            value={formData.taxLabel}
                            disabled={!isSuperAdmin}
                            onChange={(e) => handleChange("taxLabel", e.target.value)}
                            placeholder="e.g. GST or CGST+SGST"
                            maxLength={15}
                            className="h-9 text-sm bg-background"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Displayed on invoices and reports
                          </p>
                        </div>
                      </div>

                      {/* MRP Inclusive GST Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold flex items-center gap-1 text-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Prices Include GST (MRP Inclusive)
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            If enabled, item prices already include tax. Total stays equal to price, and GST is back-calculated on receipts.
                          </p>
                        </div>
                        <Switch
                          checked={formData.taxInclusive ?? false}
                          disabled={!isSuperAdmin}
                          onCheckedChange={(val) => setFormData((prev) => ({ ...prev, taxInclusive: val }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SHOW SALESPERSON ON BILL TOGGLE */}
                <div className="p-4 rounded-xl border border-primary/20 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                        <UserCheck className="h-4 w-4 text-primary" />
                        Show Salesperson Details on Bill & Fast Print
                        {!isSuperAdmin && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 inline-flex items-center font-normal">
                            <Lock className="h-3 w-3" />
                            Super Admin Only
                          </Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, salesperson details will be shown on printable bills, thermal invoices, label receipts, and fast print.
                      </p>
                    </div>
                    <Switch
                      checked={formData.showSalespersonOnBill ?? true}
                      disabled={!isSuperAdmin}
                      onCheckedChange={(val) => setFormData((prev) => ({ ...prev, showSalespersonOnBill: val }))}
                    />
                  </div>
                </div>

                {/* Receipt Footer Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="receiptFooter" className="text-xs font-semibold flex items-center gap-1.5">
                    <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                    Receipt Footer Message
                  </Label>
                  <Input
                    id="receiptFooter"
                    value={formData.receiptFooter}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("receiptFooter", e.target.value)}
                    placeholder="e.g. Thank you, Visit Again!"
                    maxLength={50}
                    className="h-9 text-sm"
                  />
                </div>

                {/* WhatsApp Message Template Section */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsappTemplate" className="text-xs font-semibold flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      WhatsApp Message Template
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Click tags below to insert</span>
                  </div>
                  <Textarea
                    id="whatsappTemplate"
                    value={formData.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE}
                    disabled={!isSuperAdmin}
                    onChange={(e) => handleChange("whatsappTemplate", e.target.value)}
                    placeholder="Enter WhatsApp template..."
                    rows={7}
                    className="text-xs font-mono resize-y bg-background"
                  />
                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "{store_name}",
                      "{invoice_number}",
                      "{customer_name}",
                      "{date}",
                      "{time}",
                      "{items_list}",
                      "{subtotal}",
                      "{discount_line}",
                      "{tax_line}",
                      "{total}",
                      "{payment_method}",
                      "{email}",
                      "{instagram}",
                      "{whatsapp_number}",
                      "{footer}",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        disabled={!isSuperAdmin}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            whatsappTemplate: (prev.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE) + ` ${tag}`,
                          }))
                        }
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/80 bg-muted/60 hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Customize how your WhatsApp receipt message appears when sent to customers.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={!isSuperAdmin || isUpdating}
                    className="w-full sm:w-auto bg-primary text-primary-foreground flex items-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {isUpdating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : !isSuperAdmin ? (
                      <Lock className="h-4 w-4 text-amber-300" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isUpdating
                      ? "Saving Changes..."
                      : !isSuperAdmin
                      ? "Super Admin Only (Locked)"
                      : "Save Store Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* LIVE RECEIPT PREVIEW (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/60 shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-primary" />
                  Live Receipt Header Preview
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dynamic Preview
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time preview of how thermal receipts and POS label bills will print.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center shadow-md rounded-lg overflow-hidden max-w-[280px] mx-auto">
                <LabelBill
                  data={{
                    invoiceNumber: "INV-SAMPLE-1001",
                    customerName: "Walk-in Customer",
                    customerPhone: "+91 98765 43210",
                    salespersonName: "Rahul Sharma",
                    createdAt: new Date(),
                    paymentMethod: "Cash",
                    items: [
                      { name: "Cotton Shirt", quantity: 1, price: 850 },
                      { name: "Silk Dupatta", quantity: 2, price: 600 },
                    ],
                    subtotal: 2050,
                    taxPercent: formData.taxEnabled ? formData.taxPercent : 0,
                    taxAmount: formData.taxEnabled ? Math.round(2050 * (formData.taxPercent / 100)) : 0,
                    totalAmount: formData.taxEnabled ? Math.round(2050 + 2050 * (formData.taxPercent / 100)) : 2050,
                  }}
                  storeSettings={formData}
                />
              </div>

              {/* TEST ACTIONS FOR THERMAL PRINTER & WHATSAPP */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  Test Print & Exporters:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex items-center justify-center gap-1"
                    onClick={() => {
                      const testData: InvoiceData = {
                        invoiceNumber: "INV-SAMPLE-1001",
                        date: new Date(),
                        customerName: "Walk-in Customer",
                        customerPhone: "+91 98765 43210",
                        salespersonName: "Rahul Sharma",
                        items: [
                          { name: "Cotton Shirt", quantity: 1, price: 850, total: 850 },
                          { name: "Silk Dupatta", quantity: 2, price: 600, total: 1200 },
                        ],
                        subtotal: 2050,
                        taxPercent: formData.taxEnabled ? formData.taxPercent : 0,
                        tax: formData.taxEnabled ? Math.round(2050 * (formData.taxPercent / 100)) : 0,
                        total: formData.taxEnabled ? Math.round(2050 + 2050 * (formData.taxPercent / 100)) : 2050,
                        paymentMethod: "Cash",
                        storeSettings: formData,
                      };
                      invoicePrinter.printInvoice(testData);
                    }}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Test Print
                  </Button> */}

                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1"
                    onClick={() => {
                      const taxAmt = formData.taxEnabled ? Math.round(2050 * (formData.taxPercent / 100)) : 0;
                      const totAmt = 2050 + taxAmt;
                      const fastData = {
                        storeName: formData.storeName || "Bhotiya Fabric Collection",
                        store_name: formData.storeName || "Bhotiya Fabric Collection",
                        address: formData.address || "",
                        phone: formData.phone || "",
                        email: formData.email || "",
                        gstNumber: formData.gstNumber || "",
                        gst_number: formData.gstNumber || "",
                        tagline: formData.tagline || "",
                        receiptFooter: formData.receiptFooter || "Thank you, Visit Again!",
                        receipt_footer: formData.receiptFooter || "Thank you, Visit Again!",
                        footer: formData.receiptFooter || "Thank you, Visit Again!",
                        instagram: formData.instagram || "",
                        whatsappNumber: formData.whatsappNumber || "",
                        whatsapp_number: formData.whatsappNumber || "",
                        taxLabel: formData.taxLabel || "GST",
                        tax_label: formData.taxLabel || "GST",
                        taxInclusive: formData.taxInclusive ?? false,
                        tax_inclusive: formData.taxInclusive ?? false,

                        showSalesperson: formData.showSalespersonOnBill ?? true,
                        showSalespersonOnBill: formData.showSalespersonOnBill ?? true,
                        show_salesperson: formData.showSalespersonOnBill ?? true,
                        salespersonName: (formData.showSalespersonOnBill ?? true) ? "Rahul Sharma" : "",
                        salesperson: (formData.showSalespersonOnBill ?? true) ? "Rahul Sharma" : "",
                        salesPerson: (formData.showSalespersonOnBill ?? true) ? "Rahul Sharma" : "",
                        salesperson_name: (formData.showSalespersonOnBill ?? true) ? "Rahul Sharma" : "",

                        invoiceNumber: "INV-SAMPLE-1001",
                        invoice_number: "INV-SAMPLE-1001",
                        customerName: "Walk-in Customer",
                        customer_name: "Walk-in Customer",
                        customerPhone: "+91 98765 43210",
                        customer_phone: "+91 98765 43210",
                        date: new Date().toLocaleDateString("en-IN"),
                        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
                        paymentMethod: "Cash",
                        payment_method: "Cash",
                        items: [
                          { name: "Cotton Shirt", qty: 1, quantity: 1, price: "850", gross: "850", discount: "0", total: "850" },
                          { name: "Silk Dupatta", qty: 2, quantity: 2, price: "600", gross: "1,200", discount: "0", total: "1,200" },
                        ],
                        subtotal: "2,050",
                        discount: "0",
                        tax: taxAmt.toLocaleString("en-IN"),
                        taxPercent: formData.taxEnabled ? formData.taxPercent : 0,
                        tax_percent: formData.taxEnabled ? formData.taxPercent : 0,
                        total: totAmt.toLocaleString("en-IN"),
                      };
                      const json = JSON.stringify(fastData);
                      const base64 = btoa(unescape(encodeURIComponent(json)));
                      const deepLink = `wts://receipt?json=${encodeURIComponent(base64)}`;
                      console.log("🧾 [Native Settings Test Fast Print Triggered]", {
                        deepLink,
                        fastData,
                      });
                      window.location.href = deepLink;
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Fast Print
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs flex items-center justify-center gap-1"
                    onClick={() => {
                      const testData: InvoiceData = {
                        invoiceNumber: "INV-SAMPLE-1001",
                        date: new Date(),
                        customerName: "Walk-in Customer",
                        customerPhone: "+91 98765 43210",
                        salespersonName: "Rahul Sharma",
                        items: [
                          { name: "Cotton Shirt", quantity: 1, price: 850, total: 850 },
                          { name: "Silk Dupatta", quantity: 2, price: 600, total: 1200 },
                        ],
                        subtotal: 2050,
                        taxPercent: formData.taxEnabled ? formData.taxPercent : 0,
                        tax: formData.taxEnabled ? Math.round(2050 * (formData.taxPercent / 100)) : 0,
                        total: formData.taxEnabled ? Math.round(2050 + 2050 * (formData.taxPercent / 100)) : 2050,
                        paymentMethod: "Cash",
                        storeSettings: formData,
                      };
                      invoicePrinter.shareViaWhatsApp(testData, "+919876543210");
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
