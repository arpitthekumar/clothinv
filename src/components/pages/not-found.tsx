import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "../shared/sidebar";
import { Header } from "../shared/header";

export default function NotFound() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Auto-close sidebar on mobile on first load

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center ">
      <Sidebar isOpen={sidebarOpen} />
      <Card className="w-full max-w-md mx-4">
        <Header
          title="Point of Sale"
          subtitle="Fast billing and checkout system"
          onSidebarToggle={toggleSidebar}
        />
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold ">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
