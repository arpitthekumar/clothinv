import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { createFullBackupZip } from "../src/server/backup/backup-archiver";
import { uploadToGoogleDrive } from "../src/server/backup/gdrive-sync";

async function testDataUpload() {
  console.log("Creating backup archive...");
  const archiveRes = await createFullBackupZip();
  if (!archiveRes.ok || !archiveRes.zipBuffer) {
    console.error("Archive failed!");
    return;
  }

  console.log(`Archive created: ${archiveRes.fileName} (${archiveRes.zipBuffer.length} bytes)`);

  const res = await uploadToGoogleDrive({
    fileName: `data-test-${Date.now()}.zip`,
    fileBuffer: archiveRes.zipBuffer,
  });

  console.log("Result:", res);
}

testDataUpload();
