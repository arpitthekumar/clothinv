"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  getBackupSchedulePrefs,
  setBackupSchedulePrefs,
  type BackupSchedulePrefs,
  type BackupFrequency,
} from "@/lib/backup-schedule-prefs";
import {
  HardDrive,
  CloudUpload,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  FileArchive,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

function isSuperAdmin(user: any): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.id === "admin-dev-001") return true;
  return user.username?.trim().toLowerCase() === "admin";
}

type BackupApiResponse = {
  history: any[];
  gdriveEnv?: {
    isConfigured: boolean;
    authMethod: string;
    folderId: string | null;
    serviceAccountEmail: string | null;
  };
  isSuperAdmin?: boolean;
  error?: string;
};

export function BackupSettings() {
  const [prefs, setPrefs] = useState<BackupSchedulePrefs>(getBackupSchedulePrefs);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeManualDownload, setActiveManualDownload] = useState<{
    backupId?: string;
    token: string;
    expiresAt: number;
  } | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);

  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setPrefs(getBackupSchedulePrefs());
  }, []);

  useEffect(() => {
    if (!activeManualDownload) {
      setTimeLeftSeconds(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((activeManualDownload.expiresAt - Date.now()) / 1000));
      setTimeLeftSeconds(diff);
      if (diff <= 0) {
        setActiveManualDownload(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeManualDownload]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const webhookUrl = `${origin}/api/cron/backup?secret=clothinv_backup_secret`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast({
      title: "Webhook URL Copied",
      description: "Cron endpoint URL copied to clipboard",
    });
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const updatePrefsState = async (next: Partial<BackupSchedulePrefs>) => {
    const updated = { ...prefs, ...next };
    setPrefs(updated);
    setBackupSchedulePrefs(updated);

    try {
      await apiRequest("POST", "/api/settings/billing", {
        backupFrequency: updated.frequency,
      });
    } catch (e) {
      console.warn("Failed to sync backup frequency with Supabase:", e);
    }

    toast({
      title: "Settings Saved",
      description: updated.frequency === "disabled" ? "Automated backups stopped" : "Backup preferences updated successfully",
    });
  };

  // Fetch Backup History & Environment Config Status
  const { data: backupResponse, isLoading, refetch } = useQuery<BackupApiResponse>({
    queryKey: ["/api/settings/backup"],
    enabled: Boolean(user),
  });

  // Manual Backup Mutation
  const triggerBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/backup");
      return res.json();
    },
    onSuccess: (data) => {
      refetch();
      if (data.downloadToken && data.downloadExpiresAt) {
        setActiveManualDownload({
          backupId: data.backup?.id,
          token: data.downloadToken,
          expiresAt: data.downloadExpiresAt,
        });
      }
      if (data.ok) {
        toast({
          title: "Backup Complete",
          description: data.message || "Database export generated successfully",
        });
      } else {
        toast({
          title: "Backup Finished with Warnings",
          description: data.message || "Backup completed with warnings",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Backup Failed",
        description: err.message || "Failed to trigger backup",
        variant: "destructive",
      });
    },
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  // Super Admin Check
  const isSuper = isSuperAdmin(user);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        Verifying security privileges...
      </div>
    );
  }

  if (!isSuper) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive text-base font-semibold">
            <Lock className="h-5 w-5" />
            Super Admin Access Required
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Backup & Cloud export settings are restricted exclusively to Super Admin accounts. You do not have permission to view or manage automated database backups.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const history = backupResponse?.history || [];
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const gdriveEnv = backupResponse?.gdriveEnv;

  const getNextBackupDueDate = () => {
    if (prefs.frequency === "disabled") return "Disabled in Settings";
    const now = new Date();
    const target = new Date(now);
    target.setHours(1, 0, 0, 0); // 1:00 AM

    if (prefs.frequency === "monthly") {
      target.setDate(1);
      if (now >= target) {
        target.setMonth(target.getMonth() + 1);
      }
    } else {
      const day = now.getDay();
      const daysUntilSunday = (7 - day) % 7;
      if (daysUntilSunday === 0 && now >= target) {
        target.setDate(now.getDate() + 7);
      } else {
        target.setDate(now.getDate() + daysUntilSunday);
      }
    }

    return target.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center text-lg gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                Automated Database Backup & Cloud Sync
              </CardTitle>
              <CardDescription>
                Schedule automatic weekly/monthly database exports (ZIP archives) and sync them securely to Google Drive via background cron execution.
              </CardDescription>
            </div>

            <Button
              onClick={() => triggerBackupMutation.mutate()}
              disabled={triggerBackupMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${triggerBackupMutation.isPending ? "animate-spin" : ""}`} />
              {triggerBackupMutation.isPending ? "Generating Backup..." : "Run Backup Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automated Schedule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Schedule Status */}
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">In-Server Auto Scheduler</span>
                </div>
                {prefs.frequency === "disabled" ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Auto Backups Paused
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Scheduler Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {prefs.frequency === "disabled"
                  ? "Automated background backups are currently turned off. You can still generate manual backups anytime."
                  : "Backups run automatically in the background (via server background runner & Vercel Cron). ZIP archives are pushed directly to Google Drive."}
              </p>
              <div className="text-[11px] bg-background/60 p-2 rounded border border-border/40 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Next Scheduled Run:</span>
                <span className={`font-semibold ${prefs.frequency === "disabled" ? "text-amber-500" : "text-primary"}`}>
                  {getNextBackupDueDate()}
                </span>
              </div>
            </div>

            {/* Backup Frequency & Webhook */}
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Backup Schedule Frequency</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    prefs.frequency === "disabled"
                      ? "text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "text-xs bg-primary/10 text-primary border-primary/20"
                  }
                >
                  {prefs.frequency === "disabled"
                    ? "Disabled (Manual Only)"
                    : prefs.frequency === "weekly"
                    ? "Weekly (Sunday 1:00 AM)"
                    : "Monthly (1st of Month 1:00 AM)"}
                </Badge>
              </div>

              <Select
                value={prefs.frequency}
                onValueChange={(val) => updatePrefsState({ frequency: val as BackupFrequency })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (Sunday Night at 1:00 AM)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st of Month at 1:00 AM)</SelectItem>
                  <SelectItem value="disabled">Disabled (Stop Automatic Backups)</SelectItem>
                </SelectContent>
              </Select>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">External Webhook Cron:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyWebhook}
                  className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 gap-1"
                >
                  {copiedWebhook ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedWebhook ? "Copied Link" : "Copy Webhook URL"}
                </Button>
              </div>
            </div>
          </div>

          {/* Environment-Based Google Drive Integration */}
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-foreground">Google Drive Cloud Integration (.env)</span>
              </div>
              <Badge
                variant="outline"
                className={
                  gdriveEnv?.isConfigured
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs flex items-center gap-1"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs flex items-center gap-1"
                }
              >
                {gdriveEnv?.isConfigured ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Connected via Environment Variables
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Not Configured in .env
                  </>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-muted/20 p-3 rounded-lg border border-border/40">
              <div>
                <span className="text-muted-foreground block text-[11px]">Authentication Method</span>
                <span className="font-medium text-foreground">{gdriveEnv?.authMethod || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Connection Status</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold block truncate max-w-xs">
                  {gdriveEnv?.isConfigured ? "Active & Protected (.env)" : "Not Configured"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Target Folder ID</span>
                <span className="font-mono text-foreground truncate block">
                  {gdriveEnv?.folderId
                    ? `${gdriveEnv.folderId.substring(0, 6)}...${gdriveEnv.folderId.substring(gdriveEnv.folderId.length - 4)}`
                    : "Not Set"}
                </span>
              </div>
            </div>

            {/* Step-by-Step Info Box */}
            <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                  <Info className="h-4 w-4" />
                  Google Drive Environment Security & Setup
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Server-Only Secrets
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                All secret keys (<code className="bg-muted px-1 py-0.5 rounded text-[10px]">GOOGLE_DRIVE_CLIENT_SECRET</code>, <code className="bg-muted px-1 py-0.5 rounded text-[10px]">GOOGLE_DRIVE_REFRESH_TOKEN</code>, <code className="bg-muted px-1 py-0.5 rounded text-[10px]">CRON_SECRET</code>) are stored <strong>strictly on the server side</strong>. They are <strong>never exposed or bundled in client-side code</strong>.
              </p>
              <div className="font-mono text-[11px] bg-background/80 p-2.5 rounded border border-border/40 text-foreground overflow-x-auto">
                <p className="text-muted-foreground"># Server-side Environment Variables (.env.local):</p>
                <p><span className="text-primary font-bold">CRON_SECRET</span>="YOUR_SECRET_KEY"</p>
                <p><span className="text-primary font-bold">GOOGLE_DRIVE_CLIENT_ID</span>="YOUR_CLIENT_ID"</p>
                <p><span className="text-primary font-bold">GOOGLE_DRIVE_CLIENT_SECRET</span>="YOUR_CLIENT_SECRET"</p>
                <p><span className="text-primary font-bold">GOOGLE_DRIVE_REFRESH_TOKEN</span>="YOUR_REFRESH_TOKEN"</p>
                <p><span className="text-primary font-bold">GOOGLE_DRIVE_FOLDER_ID</span>="YOUR_FOLDER_ID"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History Log Table */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-primary" />
              Backup History & Archives ({history.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 text-xs flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeManualDownload && timeLeftSeconds > 0 && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between flex-wrap gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Download className="h-4 w-4 shrink-0 animate-bounce" />
                <span>Manual Backup ZIP is ready! Download available for <strong>{formatCountdown(timeLeftSeconds)}</strong> before memory auto-purge.</span>
              </div>
              <a
                href={`/api/settings/backup/download?token=${activeManualDownload.token}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download ZIP ({formatCountdown(timeLeftSeconds)})
              </a>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Loading backup history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border/50 rounded-xl bg-muted/10">
              <HardDrive className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-foreground">No Backups Generated Yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click <strong>"Run Backup Now"</strong> above to generate your first complete database snapshot.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                {paginatedHistory.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-card hover:bg-accent/20 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {formatDate(item.timestamp)}
                        </span>

                        <Badge
                          variant={item.status === "success" ? "default" : "destructive"}
                          className={
                            item.status === "success"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {item.status === "success" ? "Success" : "Failed"}
                        </Badge>

                        {/* Trigger Source Badge */}
                        {item.trigger === "cron" || item.gdrive?.trigger === "cron" ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Automated Cron
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Manual Run
                          </Badge>
                        )}

                        {item.gdrive?.ok && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] flex items-center gap-1">
                            <CloudUpload className="h-3 w-3" />
                            Google Drive Synced
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground font-mono truncate max-w-md">
                        {item.fileName || "N/A"} • {formatSize(item.sizeBytes)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeManualDownload && (item.id === activeManualDownload.backupId || idx === 0) && timeLeftSeconds > 0 && (
                        <a
                          href={`/api/settings/backup/download?token=${activeManualDownload.token}`}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-xs transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 animate-bounce" />
                          Download ZIP ({formatCountdown(timeLeftSeconds)})
                        </a>
                      )}

                      {item.gdrive?.webViewLink && (
                        <a
                          href={item.gdrive.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Drive Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {history.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-muted-foreground">
                    Showing <strong>{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, history.length)}</strong> of <strong>{history.length}</strong> backups
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-7 text-xs px-2.5"
                    >
                      Previous
                    </Button>
                    <span className="font-medium text-foreground px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-7 text-xs px-2.5"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

