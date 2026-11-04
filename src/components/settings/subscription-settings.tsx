"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  PhoneCall,
  RefreshCw,
  Zap,
  IndianRupee,
  Receipt,
  History,
  CreditCard,
  PlusCircle,
  TrendingUp,
  FileText,
} from "lucide-react";

function isSuperAdmin(user: any): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.id === "admin-dev-001") return true;
  return user.username?.trim().toLowerCase() === "admin";
}

type SubscriptionPaymentRecord = {
  id: string;
  date: string;
  monthsAdded: number;
  amountPaid: number;
  ratePer6Months: number;
  newExpiryDate: string;
  paymentMethod?: string;
  notes?: string;
  renewedBy?: string;
};

type SubscriptionData = {
  isSuperAdmin: boolean;
  status: "active" | "warning" | "expired";
  expiryDate: string;
  daysRemaining: number;
  isWarning: boolean;
  isExpired: boolean;
  subscriptionRate6Months: number;
  lastPaymentAmount: number;
  lastPaymentDate: string;
  lastPaymentMonths: number;
  dueAmount: number;
  subscriptionHistory: SubscriptionPaymentRecord[];
  contactPhone: string;
};

export function SubscriptionSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customDate, setCustomDate] = useState("");
  const [rateInput, setRateInput] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const isSuper = isSuperAdmin(user);

  const { data: subData, isLoading, refetch } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (subData?.subscriptionRate6Months !== undefined) {
      setRateInput(String(subData.subscriptionRate6Months));
    }
  }, [subData?.subscriptionRate6Months]);

  const renewMutation = useMutation({
    mutationFn: async (payload: {
      addMonths?: number;
      expiryDate?: string;
      subscriptionRate6Months?: number;
      amountPaid?: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/subscription", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      refetch();
      if (data.ok) {
        toast({
          title: "Subscription Updated",
          description: data.message || "Account subscription updated successfully",
        });
        setPaymentNotes("");
        setPaymentAmount("");
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update subscription",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to renew subscription",
        variant: "destructive",
      });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      const res = await apiRequest("POST", "/api/subscription", {
        updateRateOnly: true,
        subscriptionRate6Months: rate,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      refetch();
      if (data.ok) {
        toast({
          title: "Charge Rate Saved",
          description: data.message || "Subscription charge rate updated successfully",
        });
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update charge rate",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update rate",
        variant: "destructive",
      });
    },
  });

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        dateStyle: "full",
      });
    } catch {
      return iso;
    }
  };

  const formatShortDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatCurrency = (amount?: number) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  if (!isSuper) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive text-base font-semibold">
            <Lock className="h-5 w-5" />
            Super Admin Authority Required
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Subscription renewal, charge rate configuration, and account authority settings are restricted exclusively to Super Admin accounts.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rate6mo = subData?.subscriptionRate6Months || 2500;
  const daysRemaining = subData?.daysRemaining ?? 0;
  const isNegative = daysRemaining < 0;

  return (
    <div className="space-y-6">
      {/* Overview Header Card */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center text-lg gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Account Subscription & Renewal Control
              </CardTitle>
              <CardDescription className="text-xs">
                Configure 6-month subscription fees, track payments & outstanding balance, manage renewals, and record payment history.
              </CardDescription>
            </div>

            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs px-3 py-1 shrink-0 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Super Admin Authority
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Status Grid (5 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Current Expiry */}
            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Expiry Date
                </span>
              </div>
              <p className="text-xs font-bold text-foreground truncate">
                {isLoading ? "Loading..." : formatShortDate(subData?.expiryDate)}
              </p>
              <span className="text-[10px] text-muted-foreground block truncate">
                {formatDate(subData?.expiryDate)}
              </span>
            </div>

            {/* 2. Days Remaining (SUPPORT NEGATIVE NUMBER) */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                isNegative
                  ? "border-destructive/40 bg-destructive/10"
                  : daysRemaining <= 15
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-emerald-500/40 bg-emerald-500/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Days Remaining
                </span>
                {isNegative ? (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 uppercase font-mono">
                    Overdue
                  </Badge>
                ) : daysRemaining <= 15 ? (
                  <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 uppercase font-mono">
                    Expiring
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 uppercase font-mono">
                    Active
                  </Badge>
                )}
              </div>
              <p className={`text-xl font-black ${isNegative ? "text-destructive" : daysRemaining <= 15 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {isLoading ? "..." : `${daysRemaining} Days`}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                {isNegative
                  ? `Subscription is overdue by ${Math.abs(daysRemaining)} day(s)`
                  : daysRemaining <= 15
                  ? "Warning alert active"
                  : "Account operating normally"}
              </span>
            </div>

            {/* 3. Configured 6-Month Charge */}
            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                  6-Month Charge
                </span>
              </div>
              <p className="text-xl font-black text-foreground">
                {isLoading ? "..." : formatCurrency(subData?.subscriptionRate6Months)}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                Rate per 6 Months
              </span>
            </div>

            {/* 4. Last Payment Received */}
            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-blue-500" />
                  Last Payment
                </span>
              </div>
              <p className="text-xl font-black text-foreground">
                {isLoading ? "..." : formatCurrency(subData?.lastPaymentAmount)}
              </p>
              <span className="text-[10px] text-muted-foreground block truncate">
                {subData?.lastPaymentDate ? formatShortDate(subData.lastPaymentDate) : "Baseline"} ({subData?.lastPaymentMonths || 6} mo)
              </span>
            </div>

            {/* 5. Outstanding / Due Status */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${subData?.dueAmount ? "border-destructive/40 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-purple-500" />
                  Renewal Due
                </span>
              </div>
              <p className={`text-xl font-black ${subData?.dueAmount ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                {isLoading ? "..." : formatCurrency(subData?.dueAmount)}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                {subData?.dueAmount ? "Payment required for renewal" : "No outstanding balance"}
              </span>
            </div>
          </div>

          {/* Section 1: Subscription Rate Configuration */}
          <div className="p-5 rounded-xl border border-border/60 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Subscription Pricing & Fee Rate Field
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Store and update the subscription rate charged every 6 months. Adjust this value whenever price changes occur (e.g. ₹2,500 to ₹3,000 INR).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3 pt-1">
              <div className="space-y-1.5 flex-1 w-full">
                <Label htmlFor="sub-rate" className="text-xs font-semibold text-foreground">
                  Charge Rate per 6 Months (₹ INR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">₹</span>
                  <Input
                    id="sub-rate"
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    placeholder="2500"
                    className="h-9 pl-7 text-xs font-semibold bg-background"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                {[2500, 3000, 3500, 4000, 5000].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={Number(rateInput) === preset ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-xs px-2.5 font-mono"
                    onClick={() => setRateInput(String(preset))}
                  >
                    ₹{preset.toLocaleString("en-IN")}
                  </Button>
                ))}
              </div>

              <Button
                disabled={!rateInput || updateRateMutation.isPending}
                onClick={() => {
                  const val = Number(rateInput);
                  if (!isNaN(val) && val >= 0) {
                    updateRateMutation.mutate(val);
                  }
                }}
                className="h-9 text-xs px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0"
              >
                {updateRateMutation.isPending ? "Saving..." : "Save Charge Rate"}
              </Button>
            </div>
          </div>

          {/* Section 2: Quick Account Renewal & Payment Entry */}
          <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Grant Account Renewal & Record Payment
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a subscription extension term, confirm payment details, and record the transaction in the store payment history.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Payment Details Inputs */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Amount Paid (₹)</Label>
                <Input
                  type="number"
                  placeholder={`Default: ₹${rate6mo}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI / GPay / PhonePe</SelectItem>
                    <SelectItem value="Cash">Cash Payment</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other / Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Payment Notes / Reference</Label>
                <Input
                  type="text"
                  placeholder="Txn ref #, discount note, etc."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {/* +6 Months Button */}
              <Button
                onClick={() =>
                  renewMutation.mutate({
                    addMonths: 6,
                    subscriptionRate6Months: Number(rateInput) || rate6mo,
                    amountPaid: paymentAmount ? Number(paymentAmount) : rate6mo,
                    paymentMethod,
                    notes: paymentNotes || "Extended +6 Months",
                  })
                }
                disabled={renewMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 py-5 font-semibold text-xs shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${renewMutation.isPending ? "animate-spin" : ""}`} />
                Extend by +6 Months ({formatCurrency(rate6mo)})
              </Button>

              {/* +1 Year Button */}
              <Button
                variant="outline"
                onClick={() =>
                  renewMutation.mutate({
                    addMonths: 12,
                    subscriptionRate6Months: Number(rateInput) || rate6mo,
                    amountPaid: paymentAmount ? Number(paymentAmount) : rate6mo * 2,
                    paymentMethod,
                    notes: paymentNotes || "Extended +1 Year (12 Months)",
                  })
                }
                disabled={renewMutation.isPending}
                className="border-primary/40 hover:bg-primary/10 text-foreground flex items-center justify-center gap-2 py-5 font-semibold text-xs"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Extend by +1 Year ({formatCurrency(rate6mo * 2)})
              </Button>

              {/* Contact Support Card */}
              <div className="p-2.5 rounded-lg border border-border/40 bg-background flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Support Contact Phone</span>
                  <span className="font-mono font-bold text-foreground text-xs">+91 6398217416</span>
                </div>
              </div>
            </div>

            {/* Custom Expiry Date Box */}
            <div className="pt-2 flex flex-col sm:flex-row items-end gap-3 border-t border-border/40">
              <div className="space-y-1 flex-1">
                <Label htmlFor="custom-expiry" className="text-[11px] text-muted-foreground">
                  Or Set Custom Subscription Expiry Date
                </Label>
                <Input
                  id="custom-expiry"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <Button
                variant="secondary"
                disabled={!customDate || renewMutation.isPending}
                onClick={() => {
                  if (customDate) {
                    renewMutation.mutate({
                      expiryDate: new Date(customDate).toISOString(),
                      subscriptionRate6Months: Number(rateInput) || rate6mo,
                      amountPaid: paymentAmount ? Number(paymentAmount) : undefined,
                      paymentMethod,
                      notes: paymentNotes || "Custom expiry date update",
                    });
                  }
                }}
                className="h-9 text-xs px-4"
              >
                Set Custom Date
              </Button>
            </div>
          </div>

          {/* Section 3: Subscription Payment Ledger & History Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-purple-500" />
                Subscription Payment Ledger & History
              </h4>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {subData?.subscriptionHistory?.length || 0} Transactions Recorded
              </Badge>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-2xs">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold py-3">Date & Time</TableHead>
                    <TableHead className="text-[11px] font-bold py-3">Term Added</TableHead>
                    <TableHead className="text-[11px] font-bold py-3">Rate (6 Mo)</TableHead>
                    <TableHead className="text-[11px] font-bold py-3">Amount Paid</TableHead>
                    <TableHead className="text-[11px] font-bold py-3">New Expiry Date</TableHead>
                    <TableHead className="text-[11px] font-bold py-3">Method & Notes</TableHead>
                    <TableHead className="text-[11px] font-bold py-3 text-right">Renewed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subData?.subscriptionHistory && subData.subscriptionHistory.length > 0 ? (
                    subData.subscriptionHistory.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-medium py-3">
                          {formatShortDate(rec.date)}
                        </TableCell>
                        <TableCell className="text-xs py-3">
                          <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
                            +{rec.monthsAdded} Month(s)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono py-3">
                          {formatCurrency(rec.ratePer6Months)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400 py-3">
                          {formatCurrency(rec.amountPaid)}
                        </TableCell>
                        <TableCell className="text-xs font-medium py-3">
                          {formatShortDate(rec.newExpiryDate)}
                        </TableCell>
                        <TableCell className="text-xs py-3">
                          <span className="font-semibold text-foreground block">{rec.paymentMethod || "Direct"}</span>
                          {rec.notes && <span className="text-[10px] text-muted-foreground block truncate max-w-[200px]">{rec.notes}</span>}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground py-3 font-mono">
                          {rec.renewedBy || "Super Admin"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <FileText className="h-6 w-6 text-muted-foreground/40" />
                          <span>No subscription payment records logged yet.</span>
                          <span className="text-[11px] text-muted-foreground/70">
                            Click "+6 Months" or "+1 Year" above to grant a renewal and log the initial transaction.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
