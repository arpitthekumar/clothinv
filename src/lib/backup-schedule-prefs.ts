export const BACKUP_PREFS_KEY = "clothinv.backup.prefs.v1";

export type BackupFrequency = "weekly" | "monthly" | "disabled";

export type BackupSchedulePrefs = {
  version: 1;
  autoBackupEnabled: boolean;
  frequency: BackupFrequency;
  gdriveToken: string;
  gdriveFolderId: string;
};

export const DEFAULT_BACKUP_PREFS: BackupSchedulePrefs = {
  version: 1,
  autoBackupEnabled: true,
  frequency: "weekly",
  gdriveToken: "",
  gdriveFolderId: "",
};

export function getBackupSchedulePrefs(): BackupSchedulePrefs {
  if (typeof window === "undefined") return DEFAULT_BACKUP_PREFS;
  try {
    const raw = localStorage.getItem(BACKUP_PREFS_KEY);
    if (!raw) return DEFAULT_BACKUP_PREFS;
    const parsed = JSON.parse(raw) as Partial<BackupSchedulePrefs>;
    return { ...DEFAULT_BACKUP_PREFS, ...parsed };
  } catch {
    return DEFAULT_BACKUP_PREFS;
  }
}

export function setBackupSchedulePrefs(next: BackupSchedulePrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKUP_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("backup-prefs-changed"));
}
