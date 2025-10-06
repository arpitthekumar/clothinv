import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { BillingInterface } from "@/components/pos/billing-interface";

export default function POS() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-dvh md:h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Point of Sale"
          subtitle="Fast billing and checkout system"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <BillingInterface />
        </main>
      </div>
    </div>
  );
}
