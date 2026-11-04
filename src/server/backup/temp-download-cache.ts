export interface CachedBackupZip {
  id: string;
  fileName: string;
  zipBuffer: Buffer;
  expiresAt: number;
}

const tempDownloadMap = new Map<string, CachedBackupZip>();

export function storeTempBackupZip(id: string, fileName: string, zipBuffer: Buffer): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 120 * 1000; // 2 minutes (120 seconds)
  const token = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  tempDownloadMap.set(token, {
    id,
    fileName,
    zipBuffer,
    expiresAt,
  });

  // Automatically purge from memory after 120 seconds
  setTimeout(() => {
    tempDownloadMap.delete(token);
  }, 120 * 1000);

  return { token, expiresAt };
}

export function getTempBackupZip(token: string): CachedBackupZip | null {
  const cached = tempDownloadMap.get(token);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    tempDownloadMap.delete(token);
    return null;
  }
  return cached;
}
