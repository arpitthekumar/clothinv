
"use client";

import RequireAuth from "./_components/require-auth";
import POS from "@/components/pages/pos";


export default function Home() {

  return (
    <RequireAuth>
      <POS />
    </RequireAuth>
  );
}
