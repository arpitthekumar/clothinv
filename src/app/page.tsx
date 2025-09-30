
"use client";

import Dashboard from "@/components/pages/dashboard";
import RequireAuth from "./_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
