import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Plus, Menu, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
}

export function Header({ title, subtitle, onSidebarToggle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const notificationCount = Array.isArray(notifications) ? notifications.length : 0;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onSidebarToggle}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-page-title">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <Link href="/pos">
            <Button data-testid="button-quick-sale">
              <Plus className="mr-2 h-4 w-4" />
              Quick Sale
            </Button>
          </Link>
          
          {/* Notifications */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-notifications">
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b">
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {notificationsLoading ? "Loading..." : notificationsError ? "Failed to load" : notificationCount === 0 ? "No new notifications" : `${notificationCount} new update${notificationCount > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="max-h-64 overflow-auto">
                  {!notificationsLoading && !notificationsError && Array.isArray(notifications) && notifications.length > 0 && notifications.map((n: any) => (
                    <div key={n.id} className="p-4 hover:bg-accent">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.description && (
                        <p className="text-xs text-muted-foreground">{n.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* <div className="p-2 border-t">
                  <Link href="/notifications">
                    <Button variant="ghost" className="w-full justify-center text-sm">View all</Button>
                  </Link>
                </div> */}
              </PopoverContent>
            </Popover>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-primary-foreground text-sm" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium" data-testid="text-user-name">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
                {user?.role}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
