"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Store,
  BarChart3,
  Package,
  Users,
  FileBarChart,
  Settings,
  Search,
  RotateCcw,
  ScanBarcode,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = usePathname();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
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

  const adminMenuItems = [
    { href: "/admin", icon: BarChart3, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/sales", icon: Receipt, label: "Sales Management" },
    { href: "/reports", icon: FileBarChart, label: "Reports" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const employeeMenuItems = [
    { href: "/", icon: RotateCcw, label: "Dashboard" },
    { href: "/inventory", icon: Search, label: "Find Products" },
  ];

  const commonMenuItems = [
    { href: "/pos", icon: ScanBarcode, label: "Point of Sale" },
  ];

  const menuItems = user?.role === "admin" ? adminMenuItems : employeeMenuItems;

  return (
    <div
      className={cn(
        "bg-card border-r border-border transition-all duration-300 flex-shrink-0 h-screen",
        "overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
        isOpen ? "w-64" : "w-0 lg:w-64"
      )}
    >
      <div
        className={cn(
          "flex flex-col min-h-full",
          isOpen ? "block" : "hidden lg:flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Store className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WTS ShopFlow</h1>
              <p className="text-sm text-muted-foreground">
                Inventory Management
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="hidden md:block">
                <p className="text-sm font-medium">
                  {user?.fullName || user?.username}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isMounted && connectionStatus.online ? (
                  <>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        connectionStatus.syncing
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-green-500"
                      )}
                    />
                    <span className="text-xs text-green-600 font-semibold">
                      {connectionStatus.syncing ? "Syncing..." : "Online"}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-red-600 font-semibold">
                      Offline
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-xs text-muted-foreground">
                Last sync: {connectionStatus.lastSync}
              </div>
              <p
                className={`text-xs capitalize ${
                  user?.role === "admin"
                    ? "text-orange-300"
                    : user?.role === "employee"
                    ? "text-blue-500"
                    : "text-muted-foreground"
                }`}
              >
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Scrollable Navigation Menu */}
        <nav className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="space-y-1">
            {/* Role-specific Menu Items */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {user?.role === "admin" ? "Admin" : "Employee"}
              </div>
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Common Menu Items */}
            <div className="border-t border-border pt-4 mt-4">
              {commonMenuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
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
