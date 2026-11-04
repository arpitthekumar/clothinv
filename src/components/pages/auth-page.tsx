import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, LoginResponse } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { UserSession } from "@shared/schema";
import { redirect } from "next/navigation";
import { Shield, BarChart3, Monitor, Smartphone, LogOut, AlertTriangle, ArrowLeft, Lock, PhoneCall, HelpCircle } from "lucide-react";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { maskIpAddress, SUPPORT_PHONE_NUMBER, ComputedDeviceStatus } from "@/lib/device-utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type EnrichedDeviceSession = UserSession & {
  statusInfo: ComputedDeviceStatus;
  maskedIp: string;
};

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [deviceLimitInfo, setDeviceLimitInfo] = useState<{
    activeDevices: EnrichedDeviceSession[];
    hasReplaceableDevice?: boolean;
    supportPhone: string;
    credentials: LoginFormValues;
  } | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    if (user.role === "admin") {
      redirect("/");
    } else {
      redirect("/pos");
    }
  }

  const onLoginSubmit = (data: LoginFormValues) => {
    setDeviceLimitInfo(null);
    loginMutation.mutate(data, {
      onSuccess: (res: LoginResponse) => {
        if ("deviceLimitReached" in res && res.deviceLimitReached) {
          setDeviceLimitInfo({
            activeDevices: (res as any).activeDevices || [],
            hasReplaceableDevice: (res as any).hasReplaceableDevice || false,
            supportPhone: (res as any).supportPhone || SUPPORT_PHONE_NUMBER,
            credentials: data,
          });
        }
      },
    });
  };

  const handleDisconnectAndLogin = (sessionId: string) => {
    if (!deviceLimitInfo) return;
    loginMutation.mutate({
      ...deviceLimitInfo.credentials,
      disconnectSessionId: sessionId,
    });
  };

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

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md space-y-4 my-auto">
          {/* Logo */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 overflow-hidden bg-primary/10 p-2 shadow-sm border border-border/40">
              <img src="/logo.webp" alt="wtscloth logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">wtscloth</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Inventory & POS System</p>
          </div>

          {/* Safe POS Device Limit Screen */}
          {deviceLimitInfo ? (
            <Card className="border-amber-500/40 shadow-lg flex flex-col max-h-[calc(100vh-8rem)]">
              <CardHeader className="text-center pb-2 shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-1.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">
                  {deviceLimitInfo.activeDevices.length} {deviceLimitInfo.activeDevices.length === 1 ? "Device" : "Devices"} Currently In Use
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 leading-relaxed">
                  To protect active POS checkout and transaction integrity, active sessions cannot be forcibly terminated while operations are running.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto flex-1 pr-1.5">
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {deviceLimitInfo.activeDevices.map((device) => {
                    const statusInfo = device.statusInfo;
                    const lastActiveDate = device.lastActiveAt ? new Date(device.lastActiveAt) : null;
                    const formattedTime = lastActiveDate
                      ? `${formatDistanceToNow(lastActiveDate, { addSuffix: true })}`
                      : "Recently active";

                    return (
                      <div
                        key={device.id}
                        className="p-3 rounded-xl border border-border bg-card space-y-2 hover:border-border/80 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="p-2 bg-muted rounded-lg border border-border/60">
                              {getDeviceIcon(device.deviceName)}
                            </div>
                            <div>
                              <p className="font-semibold text-xs leading-snug">{device.deviceName}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                IP: {maskIpAddress(device.ipAddress)} • Active {formattedTime}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>{renderStatusBadge(statusInfo)}</div>

                          {statusInfo.isReplaceable ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={loginMutation.isPending}
                              onClick={() => handleDisconnectAndLogin(device.id)}
                              className="text-xs font-medium gap-1 h-7 px-2.5"
                            >
                              <LogOut className="h-3 w-3" /> Replace Inactive Device
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="text-xs font-medium gap-1 h-7 px-2.5 opacity-75 cursor-not-allowed"
                            >
                              <Lock className="h-3 w-3 text-amber-500" /> Active / Protected
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Support & Recovery Info Box */}
                <div className="p-2.5 bg-muted/70 rounded-lg border text-xs space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <PhoneCall className="h-3.5 w-3.5 text-primary" />
                    Need Support or Account Recovery?
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Contact Super Admin / Developer Support:{" "}
                    <a href={`tel:${SUPPORT_PHONE_NUMBER}`} className="font-bold text-primary underline">
                      {SUPPORT_PHONE_NUMBER}
                    </a>
                  </p>
                </div>

                <div className="pt-0.5 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeviceLimitInfo(null)}
                    className="text-muted-foreground hover:text-foreground text-xs gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Standard Login Form */
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              data-testid="input-login-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground p-8 items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">Modern Inventory & POS</h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Streamline your clothing shop operations with safe session management, fast billing, and real-time analytics.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                <Shield className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Protected POS Sessions</h3>
                <p className="text-sm text-primary-foreground/80">Transaction integrity & safe device replacement</p>
              </div>
            </div>

            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-primary-foreground/80">Track sales, inventory, and performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
