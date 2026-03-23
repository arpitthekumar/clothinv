"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Smartphone } from "lucide-react";

export function ExtensionsSettingsSection() {
  const [device, setDevice] = useState<"windows" | "android" | "other">(
    "other"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) setDevice("windows");
    else if (ua.includes("Android")) setDevice("android");
    else setDevice("other");
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="mr-2 text-primary" />
          Required Extensions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border rounded-lg p-4 flex flex-col gap-3 relative transition
      ${device === "android" ? "border-green-500 " : ""}
    `}
        >
          {device === "android" && (
            <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
              Recommended
            </span>
          )}

          <div className="flex items-center gap-2">
            <Smartphone className="text-green-500" />
            <h3 className="font-semibold">Android Extension</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Install the Android APK to enable printing and hardware sync.
          </p>

          <a href="/downloads/app-release.apk" download>
            <Button className="w-full">Download APK</Button>
          </a>
        </div>

        <div
          className={`border rounded-lg p-4 flex flex-col gap-3 relative transition ${device === "windows" ? "border-blue-500" : ""} opacity-70`}
        >
          {device === "windows" && (
            <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
              Recommended
            </span>
          )}

          <span className="absolute top-2 right-2 text-xs bg-yellow-500  text-white px-2 py-1 rounded-full">
            Under Development
          </span>

          <div className="flex items-center gap-2">
            <Monitor className="text-blue-500" />
            <h3 className="font-semibold">Windows Extension</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Windows desktop app is currently under development. It will enable
            printer support and hardware sync.
          </p>

          <Button className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
