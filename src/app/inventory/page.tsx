"use client";

import Inventory from "@/components/pages/inventory";
import RequireAuth from "../_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <Inventory />
    </RequireAuth>
  );
}


