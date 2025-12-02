"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={`${user?.role === "admin" ? "Admin" : "Employee"} Dashboard`}
          subtitle={`Welcome back, ${user?.fullName || user?.username}!`}
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Stats Cards */}
          <StatsGrid />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <QuickActions />
            </div>
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
          <div>

          </div>
          {/* Inventory Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Recent Inventory Updates
            </h3>
            <InventoryTable />
          </div>
        </main>
      </div>
    </div>
  );
}
