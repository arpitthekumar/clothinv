"use client";

import { useAuth } from "@/hooks/use-auth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    redirect("/auth");
  }

  return <>{children}</>;
}


