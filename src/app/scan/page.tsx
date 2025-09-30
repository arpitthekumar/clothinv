"use client";

import Scan from "@/components/pages/scan";
import RequireAuth from "../_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <Scan />
    </RequireAuth>
  );
}


