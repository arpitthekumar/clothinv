"use client";

import Reports from "@/components/pages/reports";
import RequireAuth from "../_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <Reports />
    </RequireAuth>
  );
}


