"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Monitor,
  Smartphone,
  CheckCircle2,
  Zap,
  ShieldCheck,
  HardDrive,
  Printer,
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Cloud,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Google Drive Links (Single Source of Truth for Users)
const GDRIVE_FOLDER = "https://drive.google.com/drive/folders/1VvazBrVTOuS7DDG6mR72Jkp4ZENrAIY_?usp=sharing";
const GDRIVE_ANDROID_APK = "https://drive.google.com/file/d/1NLoFdsmqtl6bNvhAWb0mqnewlqCwosPx/view?usp=sharing";
const GDRIVE_WINDOWS_EXE = "https://drive.google.com/file/d/13bYOiznZW0GK4fxYyPpf86Fh0Ndc8zT1/view?usp=sharing";

export function ExtensionsSettingsSection() {
  const [device, setDevice] = useState<"windows" | "android" | "other">("other");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) setDevice("windows");
    else if (ua.includes("Android")) setDevice("android");
    else setDevice("other");
  }, []);

  const handleCopyLink = (url: string, label: string) => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    toast({
      title: "Link Copied!",
      description: `${label} Google Drive link copied to clipboard.`,
    });
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-border/60 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Download className="h-5 w-5" />
                </div>
                Required Extensions & Thermal Printer Helpers
              </CardTitle>
              <CardDescription className="text-sm">
                Install official companion apps for Android and Windows to enable silent thermal receipt printing, USB/COM port support, and high-speed POS hardware sync.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={GDRIVE_FOLDER}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-medium border-border/80 hover:bg-muted/80 shadow-xs">
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                  Google Drive Folder (All Apps)
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Download Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Android Extension Card */}
        <Card
          className={`relative border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
            device === "android"
              ? "border-emerald-500/80 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
              : "border-border/70 hover:border-border/90 bg-card shadow-xs"
          }`}
        >
          <CardContent className="p-6 flex flex-col h-full justify-between space-y-6">
            <div className="space-y-4">
              {/* Header row with icon & badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      Android Extension
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                      WTSPrinterHelper.apk
                    </p>
                  </div>
                </div>

                {device === "android" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium text-[11px] px-2.5 py-1 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Detected Device
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0 bg-muted/30">
                    <Cloud className="h-3 w-3 text-emerald-500" />
                    Google Drive
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Install on your Android smartphone, tablet, or POS terminal. Enables instant Bluetooth pairing, USB thermal receipt printing, and background invoice listening.
              </p>

              {/* Specification Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <HardDrive className="h-3 w-3 text-muted-foreground" />
                  Size: ~14.6 MB
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Android 7.0+
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Bluetooth & USB
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-border/50">
              <a href={GDRIVE_ANDROID_APK} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.005]">
                  <Download className="h-4 w-4" />
                  Download APK (Google Drive)
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(GDRIVE_ANDROID_APK, "Android APK")}
                  className="w-full h-8 text-xs font-normal border-border/70 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5"
                >
                  {copiedLink === GDRIVE_ANDROID_APK ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied Link
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Drive Link
                    </>
                  )}
                </Button>

                <a
                  href={GDRIVE_FOLDER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                    Open Folder
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-center text-[11px] text-muted-foreground/75 pt-0.5">
                <span>Hosted exclusively on Google Drive</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Windows Extension Card */}
        <Card
          className={`relative border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
            device === "windows"
              ? "border-blue-500/80 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
              : "border-border/70 hover:border-border/90 bg-card shadow-xs"
          }`}
        >
          <CardContent className="p-6 flex flex-col h-full justify-between space-y-6">
            <div className="space-y-4">
              {/* Header row with icon & badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      Windows Extension
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                      WtsPrinterHelper_Setup.exe
                    </p>
                  </div>
                </div>

                {device === "windows" ? (
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-medium text-[11px] px-2.5 py-1 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Detected Device
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0 bg-muted/30">
                    <Cloud className="h-3 w-3 text-blue-500" />
                    Google Drive
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Install on your Windows PC or desktop billing counter. Runs as a lightweight service supporting USB, COM/Serial, and LAN ESC/POS thermal printers.
              </p>

              {/* Specification Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <HardDrive className="h-3 w-3 text-muted-foreground" />
                  Size: ~70 MB
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                  Windows 10 / 11
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal bg-muted/50 border-border/80 gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  USB & Serial COM
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-border/50">
              <a href={GDRIVE_WINDOWS_EXE} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.005]">
                  <Download className="h-4 w-4" />
                  Download Windows (.exe)
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(GDRIVE_WINDOWS_EXE, "Windows App")}
                  className="w-full h-8 text-xs font-normal border-border/70 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5"
                >
                  {copiedLink === GDRIVE_WINDOWS_EXE ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-blue-500" />
                      Copied Link
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Drive Link
                    </>
                  )}
                </Button>

                <a
                  href={GDRIVE_FOLDER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                    Open Folder
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-center text-[11px] text-muted-foreground/75 pt-0.5">
                <span>Hosted exclusively on Google Drive</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Setup Instructions Footer Card */}
      <Card className="border-border/60 shadow-sm bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4 text-primary" />
            Quick Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background border border-border/50">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-foreground font-medium block">Download Helper</strong>
                Open Google Drive and download the installer matching your OS (Android APK or Windows EXE).
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background border border-border/50">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-foreground font-medium block">Install & Connect Printer</strong>
                Run installer and plug in your USB, Bluetooth, or LAN ESC/POS thermal receipt printer.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background border border-border/50">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-foreground font-medium block">Silent POS Checkout</strong>
                Transactions on POS automatically print receipts via the local helper without browser popups.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
