"use client";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CouponsManagement } from "@/components/settings/coupons-management";
import { Percent } from "lucide-react";

export default function CouponsPage() {
  return (
    <AdminPageShell
      requireAdmin
      title="Coupons"
      subtitle="Discount coupons"
    >
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
    </AdminPageShell>
  );
}
