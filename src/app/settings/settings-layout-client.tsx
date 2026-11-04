"use client";

import { usePathname } from "next/navigation";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { SettingsSubNav } from "@/components/settings/settings-sub-nav";
import type { ReactNode } from "react";

const META: Record<string, { title: string; subtitle: string }> = {
  "/settings/system": {
    title: "Settings",
    subtitle: "System Information",
  },
  "/settings/devices": {
    title: "Settings",
    subtitle: "Active Device Sessions & Security",
  },

  "/settings/salespersons": {
    title: "Settings",
    subtitle: "Manage Salespersons & Staff",
  },
  "/settings/products": {
    title: "Settings",
    subtitle: "Product Creation Defaults",
  },
  "/settings/backup": {
    title: "Settings",
    subtitle: "Automated Database Backup & Cloud Sync",
  },
  "/settings/extensions": {
    title: "Settings",
    subtitle: "Required Extensions",
  },
  "/settings/pos": {
    title: "Settings",
    subtitle: "POS checkout automation",
  },
};

export default function SettingsLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const meta = META[pathname] ?? {
    title: "Settings",
    subtitle: "System configuration",
  };

  return (
    <AdminPageShell requireAdmin title={meta.title} subtitle={meta.subtitle}>
      {children}
    </AdminPageShell>
  );
}
