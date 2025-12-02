import { useEffect, useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { InventoryTable } from "@/components/inventory/inventory-table";

export default function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
          title="Inventory Management"
          subtitle="Manage your products and stock levels"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <InventoryTable />
        </main>
      </div>
    </div>
  );
}
