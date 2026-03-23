"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Settings as SettingsIcon, Shield } from "lucide-react";

export function SystemInformationSection() {
  const { user } = useAuth();

  return (
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
            <p className="text-sm text-muted-foreground">Role: {user?.role}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Development Account
            </h3>
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
  );
}
