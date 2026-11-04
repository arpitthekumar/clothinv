"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Monitor, Download, Zap, Tag, CloudUpload, Store, ShieldCheck, Laptop } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function isSuperAdmin(user: any): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.id === "admin-dev-001") return true;
  return user.username?.trim().toLowerCase() === "admin";
}

const allTabs = [
  {
    href: "/settings/system",
    label: "System Information",
    icon: Monitor,
    superAdminOnly: false,
  },
  {
    href: "/settings/devices",
    label: "Active Devices & Security",
    icon: Laptop,
    superAdminOnly: false,
  },
  {
    href: "/settings/billing",
    label: "Billing & Store Details",
    icon: Store,
    superAdminOnly: false,
  },
  {
    href: "/settings/products",
    label: "Product Defaults",
    icon: Tag,
    superAdminOnly: false,
  },
  {
    href: "/settings/subscription",
    label: "Subscription & Renewal",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
  {
    href: "/settings/backup",
    label: "Backup & Cloud",
    icon: CloudUpload,
    superAdminOnly: true,
  },
  {
    href: "/settings/extensions",
    label: "Required Extensions",
    icon: Download,
    superAdminOnly: false,
  },
  {
    href: "/settings/pos",
    label: "POS checkout",
    icon: Zap,
    superAdminOnly: false,
  },
] as const;

export function SettingsSubNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuper = isSuperAdmin(user);

  const visibleTabs = allTabs.filter(
    (tab) => !tab.superAdminOnly || isSuper
  );

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-4 sm:flex-nowrap sm:overflow-x-auto"
      aria-label="Settings sections"
    >
      {visibleTabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
