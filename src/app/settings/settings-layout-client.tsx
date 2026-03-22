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
  "/settings/database": {
    title: "Settings",
    subtitle: "Supabase database",
  },
  "/settings/extensions": {
    title: "Settings",
    subtitle: "Required Extensions",
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
      <SettingsSubNav />
      {children}
    </AdminPageShell>
  );
}
