"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, Lock, PhoneCall, LogOut, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SubscriptionResponse = {
  isSuperAdmin: boolean;
  status: "active" | "warning" | "expired";
  expiryDate: string;
  daysRemaining: number;
  isWarning: boolean;
  isExpired: boolean;
  contactPhone: string;
};

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logoutMutation } = useAuth();

  const { data: subData } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/subscription"],
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  });

  // Skip guard on login/auth pages or if user is not logged in
  if (!user || pathname?.startsWith("/auth")) {
    return <>{children}</>;
  }

  const isExpired = subData?.isExpired && !subData?.isSuperAdmin;
  const isWarning = subData?.isWarning && !subData?.isSuperAdmin;
  const contactPhone = subData?.contactPhone || "+91 6398217416";

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        dateStyle: "long",
      });
    } catch {
      return iso;
    }
  };

  // FULL SCREEN LOCKOUT IF EXPIRED
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden max-h-[95vh] overflow-y-auto">
          {/* Top glow decoration */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shadow-inner">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>

          {/* Badge */}
          <div>
            <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Subscription Expired
            </Badge>
          </div>

          {/* Title & Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Account Subscription Expired
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your software access subscription ended on{" "}
              <strong className="text-foreground">{formatDate(subData?.expiryDate)}</strong>
              {(subData?.daysRemaining ?? 0) < 0 && (
                <span className="text-destructive font-semibold"> ({Math.abs(subData?.daysRemaining || 0)} days overdue)</span>
              )}. Access to POS, Inventory, and Sales features is currently locked.
            </p>
          </div>

          {/* Contact Sales Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Renewal & Contact Information
              </span>
              <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded font-mono">
                Sales Desk
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Please contact your account manager or sales representative to renew your subscription and restore full access immediately.
            </p>
            <div className="pt-1 font-mono text-sm font-bold text-foreground flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{contactPhone}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <PhoneCall className="h-4 w-4" />
              Call Sales Representative ({contactPhone})
            </a>

            <a
              href={`https://wa.me/916398217416?text=${encodeURIComponent(
                "Hi, I want to renew my ClothInv software subscription account."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 border border-border bg-muted/30 hover:bg-muted text-foreground font-medium text-xs py-2 px-4 rounded-lg transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              Chat on WhatsApp
            </a>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 pt-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out of Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 15-DAY WARNING BANNER FOR REGULAR USERS */}
      {isWarning && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between gap-3 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 animate-bounce" />
            <span>
              <strong>Subscription Warning:</strong> Your account subscription expires in{" "}
              <span className="font-bold underline">{subData?.daysRemaining} day(s)</span> on{" "}
              <strong>{formatDate(subData?.expiryDate)}</strong>. Please renew your account to avoid interruption.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${contactPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-xs"
            >
              <PhoneCall className="h-3 w-3" />
              Call {contactPhone}
            </a>
          </div>
        </div>
      )}

      <div className="flex-1">{children}</div>
    </div>
  );
}
