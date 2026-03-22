"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileState = {
  profile: "primary" | "secondary";
  primaryHost: string | null;
  secondaryHost: string | null;
  secondaryConfigured: boolean;
};

export function SupabaseProfileCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ProfileState>({
    queryKey: ["/api/settings/supabase-profile"],
    queryFn: async () => {
      const res = await fetch("/api/settings/supabase-profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load database profile");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (profile: "primary" | "secondary") => {
      await apiRequest("POST", "/api/settings/supabase-profile", { profile });
    },
    onSuccess: (_, profile) => {
      void queryClient.invalidateQueries({
        queryKey: ["/api/settings/supabase-profile"],
      });
      toast({
        title: "Database updated",
        description:
          profile === "primary"
            ? "Using primary Supabase project for this browser."
            : "Using secondary Supabase project for this browser. Reload if data looks stale.",
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Could not switch database",
        description: e.message,
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Supabase database
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Supabase database
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Could not load database settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Supabase database
        </CardTitle>
        <CardDescription>
          Choose which Supabase project this app uses for API requests in your
          session. Add secondary credentials in{" "}
          <code className="text-xs bg-muted px-1 rounded">.env.local</code>{" "}
          first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Primary</span>
            <span className="font-mono text-xs break-all text-right">
              {data.primaryHost ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Secondary</span>
            <span className="font-mono text-xs break-all text-right">
              {data.secondaryConfigured
                ? data.secondaryHost ?? "—"
                : "Not configured"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Active:{" "}
            <strong>
              {data.profile === "primary" ? "Primary" : "Secondary"}
            </strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={data.profile === "primary" ? "default" : "outline"}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate("primary")}
          >
            Use primary
          </Button>
          <Button
            variant={data.profile === "secondary" ? "default" : "outline"}
            disabled={
              mutation.isPending || !data.secondaryConfigured
            }
            onClick={() => mutation.mutate("secondary")}
            title={
              !data.secondaryConfigured
                ? "Set SUPABASE_URL_SECONDARY and SUPABASE_SERVICE_ROLE_KEY_SECONDARY in .env.local"
                : undefined
            }
          >
            Use secondary
          </Button>
        </div>
        {!data.secondaryConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Set{" "}
            <code className="bg-muted px-1 rounded">SUPABASE_URL_SECONDARY</code>{" "}
            and{" "}
            <code className="bg-muted px-1 rounded">
              SUPABASE_SERVICE_ROLE_KEY_SECONDARY
            </code>{" "}
            in <code className="bg-muted px-1 rounded">.env.local</code> (exact
            names — no extra prefix), then restart the dev server.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
