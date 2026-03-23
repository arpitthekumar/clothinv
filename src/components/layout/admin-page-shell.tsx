"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AdminPageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** When true, only users with role `admin` see the content. */
  requireAdmin?: boolean;
};

export function AdminPageShell({
  title,
  subtitle,
  children,
  requireAdmin = false,
}: AdminPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) setSidebarOpen(false);
  }, []);

  if (requireAdmin && user?.role !== "admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={title}
            subtitle="Access denied"
            onSidebarToggle={toggleSidebar}
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                  <p className="text-muted-foreground">
                    Only administrators can access this page.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onSidebarToggle={toggleSidebar}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
