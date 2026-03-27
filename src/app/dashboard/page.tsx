
"use client";

import RequireAuth from "../_components/require-auth";
import Dashboard from "@/components/pages/dashboard";


export default function DashboardPage() {

  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
