import { useEffect, useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Settings as SettingsIcon, Shield, Percent, Folder, Monitor, Smartphone, Download } from "lucide-react";
import { CouponsManagement } from "@/components/settings/coupons-management";
import { CategoriesManagement } from "@/components/settings/categories-management";
import { Button } from "../ui/button";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const [device, setDevice] = useState<"windows" | "android" | "other">("other");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;

      if (ua.includes("Windows")) {
        setDevice("windows");
      } else if (ua.includes("Android")) {
        setDevice("android");
      } else {
        setDevice("other");
      }
    }
  }, []);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, []);
  // Only allow admins to access settings
  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Settings"
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
                    Only administrators can access the settings page.
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
          title="Settings"
          subtitle="Manage system settings and users"
          onSidebarToggle={toggleSidebar}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* System Information */}
            <Card data-testid="card-system-info">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 text-primary" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Current User</h3>
                    <p className="text-sm text-muted-foreground">
                      Name: {user?.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Username: {user?.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Role: {user?.role}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Development Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Admin Username: admin
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Admin Password: admin123
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      * Development credentials only
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 text-primary" />
                  Required Extensions
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Android */}
                <div
                  className={`border rounded-lg p-4 flex flex-col gap-3 relative transition
      ${device === "android" ? "border-green-500 " : ""}
    `}
                >
                  {device === "android" && (
                    <span className="absolute top-2 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Smartphone className="text-green-500" />
                    <h3 className="font-semibold">Android Extension</h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Install the Android APK to enable printing and hardware sync.
                  </p>

                  <a href="/downloads/app-release.apk" download>
                    <Button className="w-full">
                      Download APK
                    </Button>
                  </a>
                </div>

                {/* Windows */}
                <div
                  className={`border rounded-lg p-4 flex flex-col gap-3 relative transition ${device === "windows" ? "border-blue-500" : ""} opacity-70`}
                >
                  {/* Recommended Badge */}
                  {device === "windows" && (
                    <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}

                  {/* Development Badge */}
                  <span className="absolute top-2 right-2 text-xs bg-yellow-500  text-white px-2 py-1 rounded-full">
                    Under Development
                  </span>

                  <div className="flex items-center gap-2">
                    <Monitor className="text-blue-500" />
                    <h3 className="font-semibold">Windows Extension</h3>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Windows desktop app is currently under development. It will enable printer support and hardware sync.
                  </p>

                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </div>


              </CardContent>

            </Card>

            {/* Categories Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Folder className="mr-2 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoriesManagement />
              </CardContent>
            </Card>

            {/* Discount Coupons Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="mr-2 text-primary" />
                  Discount Coupons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CouponsManagement />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
