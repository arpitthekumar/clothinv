"use client";

import RequireAuth from "../_components/require-auth";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && user.role !== "admin") {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }
  return <RequireAuth>{children}</RequireAuth>;
}


