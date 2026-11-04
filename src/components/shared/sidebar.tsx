"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Store,
  BarChart3,
  Package,
  Users,
  User,
  UserCheck,
  FileBarChart,
  Settings,
  ScanBarcode,
  Receipt,
  Folder,
  Percent,
  ChevronDown,
  Monitor,
  Tag,
  Zap,
  CloudUpload,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, Suspense } from "react";

interface SidebarProps {
  isOpen: boolean;
}

interface SubMenuItem {
  href: string;
  label: string;
  icon: any;
  superAdminOnly?: boolean;
}

interface MenuItem {
  href?: string;
  label: string;
  icon: any;
  children?: SubMenuItem[];
}

function SidebarInner({ isOpen }: SidebarProps) {
  const location = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Single accordion state: only 1 dropdown menu open at a time
  const [openMenuLabel, setOpenMenuLabel] = useState<string | null>(null);

  const [connectionStatus, setConnectionStatus] = useState({
    online: false,
    syncing: false,
    lastSync: "Just now",
  });

  useEffect(() => {
    setIsMounted(true);
    setConnectionStatus((prev) => ({
      ...prev,
      online: navigator.onLine,
    }));

    const handleOnline = () =>
      setConnectionStatus((prev) => ({ ...prev, online: true }));
    const handleOffline = () =>
      setConnectionStatus((prev) => ({ ...prev, online: false }));
    const handleDataSync = (event: CustomEvent) => {
      const { success } = event.detail;
      setConnectionStatus((prev) => ({
        ...prev,
        syncing: false,
        lastSync: success ? "Just now" : prev.lastSync,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dataSync", handleDataSync as EventListener);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dataSync", handleDataSync as EventListener);
    };
  }, []);

  const isSuperAdmin = Boolean(
    user &&
      (user.role === "superadmin" ||
        user.username?.trim().toLowerCase() === "admin" ||
        user.id === "admin-dev-001")
  );

  const isSubItemActive = (subHref: string) => {
    if (subHref.includes("?")) {
      const [path, query] = subHref.split("?");
      const targetTab = new URLSearchParams(query).get("tab");
      const currentTab = searchParams.get("tab") || (path === "/admin/users" ? "users" : "");
      return location === path && currentTab === targetTab;
    }
    return location === subHref;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.href) return location === item.href;
    if (item.children) {
      return item.children.some((child) => isSubItemActive(child.href));
    }
    return false;
  };

  // Single accordion auto-expand: auto opens active route's parent menu while closing others
  useEffect(() => {
    if (location.startsWith("/admin/users")) {
      setOpenMenuLabel("Users & Staff");
    } else if (location === "/inventory" || location === "/categories" || location === "/settings/products") {
      setOpenMenuLabel("Inventory & Catalog");
    } else if (location === "/sales" || location === "/reports" || location === "/coupons") {
      setOpenMenuLabel("Sales & Reports");
    } else if (location.startsWith("/settings")) {
      setOpenMenuLabel("Settings");
    } else {
      setOpenMenuLabel(null);
    }
  }, [location, searchParams]);

  const toggleExpand = (label: string) => {
    // Single accordion: if clicking already open menu, close it; otherwise open it and close others
    setOpenMenuLabel((prev) => (prev === label ? null : label));
  };

  const adminMenuItems: MenuItem[] = [
    { href: "/admin", icon: BarChart3, label: "Dashboard" },
    { href: "/customers", icon: Users, label: "Customers" },
    {
      label: "Users & Staff",
      icon: Users,
      children: [
        { href: "/admin/users?tab=users", label: "System Users", icon: User },
        { href: "/admin/users?tab=salespersons", label: "Salespersons", icon: UserCheck },
      ],
    },
    {
      label: "Inventory & Catalog",
      icon: Package,
      children: [
        { href: "/inventory", label: "All Products", icon: Package },
        { href: "/categories", label: "Categories", icon: Folder },
        { href: "/settings/products", label: "Product Defaults", icon: Tag },
      ],
    },
    {
      label: "Sales & Reports",
      icon: Receipt,
      children: [
        { href: "/sales", label: "Sales Management", icon: Receipt },
        { href: "/reports", label: "Reports & Analytics", icon: FileBarChart },
        { href: "/coupons", label: "Discount Coupons", icon: Percent },
      ],
    },
    
    {
      label: "Settings",
      icon: Settings,
      children: [
        { href: "/settings/system", label: "System Information", icon: Monitor },
        { href: "/settings/billing", label: "Billing & Store", icon: Store },
        { href: "/settings/subscription", label: "Subscription & Renewal", icon: ShieldCheck, superAdminOnly: true },
        { href: "/settings/pos", label: "POS Checkout", icon: Zap },
        { href: "/settings/backup", label: "Backup & Cloud", icon: CloudUpload, superAdminOnly: true },
        { href: "/settings/extensions", label: "Required Extensions", icon: Download },
      ],
    },
  ];

  const employeeMenuItems: MenuItem[] = [
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    {
      label: "Inventory",
      icon: Package,
      children: [
        { href: "/inventory", label: "All Products", icon: Package },
      ],
    },
    {
      label: "Sales",
      icon: Receipt,
      children: [
        { href: "/sales", label: "Sales Management", icon: Receipt },
      ],
    },
    { href: "/customers", icon: Users, label: "Customers" },
  ];

  const commonMenuItems: MenuItem[] = [
    { href: "/pos", icon: ScanBarcode, label: "Point of Sale" },
  ];

  const menuItems =
    user?.role === "admin" || user?.role === "superadmin" || user?.username?.trim().toLowerCase() === "admin"
      ? adminMenuItems
      : employeeMenuItems;

  return (
    <div
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex-shrink-0 h-screen overflow-hidden",
        isOpen ? "w-64" : "w-0 lg:w-64"
      )}
    >
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden",
          isOpen ? "block" : "hidden lg:flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex-shrink-0 border-b border-border/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-primary/10 border border-border/40 shrink-0">
              <img src="/logo.webp" alt="wtscloth logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">wtscloth</h1>
              <p className="text-xs text-muted-foreground">
                Inventory Management
              </p>
            </div>
          </div>

          {/* Connection & Profile Status */}
          <div className="mt-3 p-2.5 bg-muted/60 rounded-lg border border-border/40">
            <div className="flex items-center justify-between">
              <div className="hidden md:block">
                <p className="text-xs font-semibold truncate max-w-[120px]">
                  {user?.fullName || user?.username}
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                {isMounted && connectionStatus.online ? (
                  <>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        connectionStatus.syncing
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-emerald-500"
                      )}
                    />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {connectionStatus.syncing ? "Syncing..." : "Online"}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[11px] text-red-500 font-medium">
                      Offline
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground">
                Sync: {connectionStatus.lastSync}
              </span>
              <span
                className={`text-[10px] capitalize font-semibold ${
                  user?.role === "superadmin" || user?.username?.trim().toLowerCase() === "admin"
                    ? "text-purple-500 dark:text-purple-400"
                    : user?.role === "admin"
                    ? "text-amber-500"
                    : "text-blue-500"
                }`}
              >
                {user?.role === "superadmin" || user?.username?.trim().toLowerCase() === "admin"
                  ? "Super Admin"
                  : user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Scrollable Navigation Menu (Scrollbar hidden for clean UX) */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-1">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-2">
                {user?.role === "superadmin" || user?.username?.trim().toLowerCase() === "admin"
                  ? "Super Admin"
                  : user?.role === "admin"
                  ? "Admin"
                  : "Employee"}
              </div>

              {menuItems.map((item) => {
                if (item.children) {
                  const isExpanded = openMenuLabel === item.label;
                  const hasActiveChild = isParentActive(item);

                  const filteredChildren = item.children.filter(
                    (child) => !child.superAdminOnly || isSuperAdmin
                  );

                  return (
                    <div key={item.label} className="my-0.5">
                      <Button
                        variant={hasActiveChild && !isExpanded ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-between font-medium text-sm h-9 px-3 transition-colors",
                          hasActiveChild && "text-primary font-semibold bg-primary/10 hover:bg-primary/15",
                          isExpanded && "bg-accent/80 text-accent-foreground font-semibold"
                        )}
                        onClick={() => toggleExpand(item.label)}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </Button>

                      {isExpanded && (
                        <div className="pl-3 ml-3 border-l-2 border-primary/30 space-y-0.5 my-1 transition-all">
                          {filteredChildren.map((child) => {
                            const active = isSubItemActive(child.href);
                            const ChildIcon = child.icon;
                            return (
                              <Link key={child.href} href={child.href}>
                                <Button
                                  variant={active ? "default" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "w-full justify-start text-xs h-8 px-2.5 font-normal transition-all",
                                    active && "font-semibold shadow-xs"
                                  )}
                                >
                                  <ChildIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = location === item.href;
                return (
                  <Link key={item.href || item.label} href={item.href || "#"}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-sm h-9 px-3 my-0.5 font-medium transition-colors",
                        active && "font-semibold"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Common Menu Items */}
            <div className="border-t border-border/40 pt-3 mt-3">
              {commonMenuItems.map((item) => (
                <Link key={item.href || item.label} href={item.href || "#"}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm h-9 px-3 font-medium transition-colors",
                      location === item.href && "font-semibold"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <Suspense fallback={<div className="w-0 lg:w-64 flex-shrink-0" />}>
      <SidebarInner isOpen={isOpen} />
    </Suspense>
  );
}
