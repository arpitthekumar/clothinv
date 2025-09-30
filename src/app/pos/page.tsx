"use client";

import POS from "@/components/pages/pos";
import RequireAuth from "../_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <POS />
    </RequireAuth>
  );
}


