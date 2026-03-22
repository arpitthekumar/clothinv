"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Monitor, Database, Download } from "lucide-react";

const tabs = [
  {
    href: "/settings/system",
    label: "System Information",
    icon: Monitor,
  },
  {
    href: "/settings/database",
    label: "Supabase database",
    icon: Database,
  },
  {
    href: "/settings/extensions",
    label: "Required Extensions",
    icon: Download,
  },
] as const;

export function SettingsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-4"
      aria-label="Settings sections"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
