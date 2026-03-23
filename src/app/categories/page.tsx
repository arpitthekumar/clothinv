"use client";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriesManagement } from "@/components/settings/categories-management";
import { Folder } from "lucide-react";

export default function CategoriesPage() {
  return (
    <AdminPageShell
      requireAdmin
      title="Categories"
      subtitle="Manage product categories"
    >
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
    </AdminPageShell>
  );
}
