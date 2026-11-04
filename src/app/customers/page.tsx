"use client";

import CustomersPage from "@/components/pages/customers";
import RequireAuth from "../_components/require-auth";

export default function Page() {
  return (
    <RequireAuth>
      <CustomersPage />
    </RequireAuth>
  );
}
