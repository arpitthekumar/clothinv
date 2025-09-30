import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Plus, Menu, User } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSidebarToggle: () => void;
}

export function Header({ title, subtitle, onSidebarToggle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

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
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
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
