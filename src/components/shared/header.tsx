"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Plus, Menu, User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const count = Array.isArray(notifications) ? notifications.length : 0;

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 md:py-4 sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left section */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Sidebar toggle (mobile only) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onSidebarToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Title & subtitle */}
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap justify-end">
          {/* Quick Sale */}
          <div className="hidden lg:block">
            <Link href="/pos">
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Quick Sale
              </Button>
            </Link>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 sm:w-80 p-0">
              <div className="p-4 border-b">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? "Loading..."
                    : error
                      ? "Failed to load"
                      : count === 0
                        ? "No new notifications"
                        : `${count} new update${count > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="max-h-64 overflow-auto">
                {!isLoading &&
                  !error &&
                  Array.isArray(notifications) &&
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-accent">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.description && (
                        <p className="text-xs text-muted-foreground">
                          {n.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-primary-foreground text-sm" />
              </div>
              <div className="hidden md:block ml-2">
                <p className="text-sm font-medium">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
