import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { runBackup } from "./export";

export interface BackupArchiveResult {
  ok: boolean;
  zipPath?: string;
  zipBuffer?: Buffer;
  fileName?: string;
  totalSizeBytes?: number;
  outputDir?: string;
  errors?: string[];
}

/**
 * Packs a backup directory into a single .zip file buffer in memory and IMMEDIATELY purges disk files.
 */
export async function zipBackupDirectory(runDir: string): Promise<{ fileName: string; zipBuffer: Buffer; totalSizeBytes: number }> {
  const zip = new JSZip();

  const addFilesToZip = (currentDir: string, relativePrefix: string = "") => {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const zipPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        addFilesToZip(fullPath, zipPath);
      } else if (entry.isFile()) {
        const fileData = fs.readFileSync(fullPath);
        zip.file(zipPath, fileData);
      }
    }
  };

  addFilesToZip(runDir);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const fileName = `${path.basename(runDir)}.zip`;

  // ZERO-DISK RETENTION: Immediately delete temporary export directory from disk
  try {
    if (fs.existsSync(runDir)) {
      fs.rmSync(runDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn("Notice: Failed to purge temporary backup directory:", err);
  }

  return {
    fileName,
    zipBuffer,
    totalSizeBytes: zipBuffer.length,
  };
}

/**
 * Runs full backup, produces in-memory .zip package, and guarantees no disk retention.
 */
export async function createFullBackupZip(): Promise<BackupArchiveResult> {
  try {
    const backupRes = await runBackup({ canonicalOnly: false, continueOnError: true });
    if (!backupRes.ok && backupRes.errors.length > 0 && !fs.existsSync(backupRes.outputDir)) {
      return {
        ok: false,
        errors: backupRes.errors,
      };
    }

    const { fileName, zipBuffer, totalSizeBytes } = await zipBackupDirectory(backupRes.outputDir);

    return {
      ok: backupRes.ok,
      zipBuffer,
      fileName,
      totalSizeBytes,
      errors: backupRes.errors,
    };
  } catch (error: any) {
    return {
      ok: false,
      errors: [error.message || String(error)],
    };
  }
}
