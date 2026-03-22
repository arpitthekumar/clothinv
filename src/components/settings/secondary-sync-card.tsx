"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseBackup, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileApi = {
  canManageSupabase: boolean;
  secondaryConfigured: boolean;
};

export function SecondarySyncCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data, isLoading } = useQuery<ProfileApi>({
    queryKey: ["/api/settings/supabase-profile"],
    queryFn: async () => {
      const res = await fetch("/api/settings/supabase-profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/secondary/sync-from-primary", {
        confirm: "RESET_SECONDARY",
      });
    },
    onSuccess: () => {
      setConfirmOpen(false);
      setConfirmText("");
      void queryClient.invalidateQueries();
      toast({
        title: "Secondary database updated",
        description:
          "Backed up primary, cleared secondary, and restored from that backup.",
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: e.message,
      });
    },
  });

  if (isLoading || !data?.canManageSupabase) {
    return null;
  }

  if (!data.secondaryConfigured) {
    return null;
  }

  return (
    <>
      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="h-5 w-5 text-amber-600" />
            Secondary: backup &amp; full resync
          </CardTitle>
          <CardDescription>
            Super admin only. Runs a fresh backup from the{" "}
            <strong>primary</strong> project, deletes all rows in the{" "}
            <strong>secondary</strong> database, then restores that backup into
            secondary. Use after changing primary data or to reset secondary to
            match primary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-amber-700 dark:text-amber-500 flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            Destructive on secondary: all current secondary data is removed
            before restore. This can take a minute.
          </p>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Working…
              </>
            ) : (
              "Backup primary → clear secondary → restore"
            )}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!mutation.isPending) setConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite secondary database?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>
                This will back up primary, then <strong>erase all data</strong>{" "}
                in secondary and replace it with that backup.
              </span>
              <div className="space-y-2 pt-2">
                <Label htmlFor="sync-confirm">
                  Type <code className="bg-muted px-1">RESET_SECONDARY</code>{" "}
                  to confirm
                </Label>
                <Input
                  id="sync-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESET_SECONDARY"
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={
                mutation.isPending || confirmText.trim() !== "RESET_SECONDARY"
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Running…
                </>
              ) : (
                "Confirm sync"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
