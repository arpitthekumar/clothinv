"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { SettingsSubNav } from "@/components/settings/settings-sub-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSession } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Monitor, Smartphone, ShieldAlert, LogOut, RefreshCw, CheckCircle2, Lock, PhoneCall } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { computeDeviceStatusInfo, maskIpAddress, SUPPORT_PHONE_NUMBER, ComputedDeviceStatus } from "@/lib/device-utils";

type DevicesResponse = {
  devices: (UserSession & { isCurrentDevice?: boolean })[];
  maxAllowed: number;
};

export default function DevicesSettingsPage() {
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<DevicesResponse>({
    queryKey: ["/api/user/devices"],
    refetchInterval: 10000, // auto-refresh every 10 seconds
  });

  const disconnectMutation = useMutation({
    mutationFn: async (payload: { sessionId?: string; logoutAllOthers?: boolean }) => {
      const res = await fetch("/api/user/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to disconnect device");
      }
      return await res.json();
    },
    onSuccess: (res) => {
      toast({
        title: "Device Session Revoked",
        description: res.message || "Successfully revoked device session.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/devices"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Action Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const getDeviceIcon = (deviceName?: string) => {
    const name = (deviceName || "").toLowerCase();
    if (name.includes("iphone") || name.includes("android") || name.includes("mobile") || name.includes("ipad")) {
      return <Smartphone className="h-6 w-6 text-amber-500" />;
    }
    return <Monitor className="h-6 w-6 text-blue-500" />;
  };

  const renderStatusBadge = (statusInfo: ComputedDeviceStatus) => {
    if (statusInfo.isBusy) {
      return (
        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-[10px] py-0.5 px-2 gap-1 font-semibold">
          <Lock className="h-3 w-3" /> BUSY • {statusInfo.statusLabel}
        </Badge>
      );
    }
    if (statusInfo.status === "ONLINE") {
      return (
        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] py-0.5 px-2 font-medium">
          ● ONLINE / ACTIVE
        </Badge>
      );
    }
    if (statusInfo.status === "IDLE") {
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] py-0.5 px-2">
          ○ IDLE ({statusInfo.idleMinutes}m ago)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground text-[10px] py-0.5 px-2">
        ○ INACTIVE ({statusInfo.idleMinutes}m ago)
      </Badge>
    );
  };

  const devices = data?.devices || [];
  const maxAllowed = data?.maxAllowed || 2;
  const activeCount = devices.length;

  return (
    <div className="space-y-6">
      <SettingsSubNav />

      {/* Overview Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Active Device Sessions
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Your account allows up to <strong>{maxAllowed} concurrent device sessions</strong> with POS operation protection. You can log out of an old device below.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeCount >= maxAllowed ? "destructive" : "secondary"} className="text-xs px-2.5 py-1">
              {activeCount} / {maxAllowed} Devices Active
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading active devices...</div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No active sessions found.</div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const statusInfo = computeDeviceStatusInfo(device);
                const lastActiveDate = device.lastActiveAt ? new Date(device.lastActiveAt) : null;
                const formattedTime = lastActiveDate
                  ? formatDistanceToNow(lastActiveDate, { addSuffix: true })
                  : "Recently active";

                return (
                  <div
                    key={device.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-3 bg-muted rounded-lg border border-border/50">
                        {getDeviceIcon(device.deviceName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base leading-snug">{device.deviceName}</p>
                          {device.isCurrentDevice && (
                            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] py-0 px-2 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> This Device
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          IP: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{maskIpAddress(device.ipAddress)}</code> • Last active: {formattedTime}
                        </p>
                        <div className="mt-1.5">{renderStatusBadge(statusInfo)}</div>
                      </div>
                    </div>

                    {!device.isCurrentDevice ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disconnectMutation.isPending}
                        onClick={() => disconnectMutation.mutate({ sessionId: device.id })}
                        className="text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 self-start sm:self-center"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Log Out Device
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium self-start sm:self-center">Active Current Session</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-primary shrink-0" />
              Need account recovery or support? Contact Super Admin:{" "}
              <a href={`tel:${SUPPORT_PHONE_NUMBER}`} className="font-bold text-foreground underline">
                {SUPPORT_PHONE_NUMBER}
              </a>
            </div>

            {devices.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                disabled={disconnectMutation.isPending}
                onClick={() => disconnectMutation.mutate({ logoutAllOthers: true })}
                className="gap-1.5 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out All Other Devices
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
