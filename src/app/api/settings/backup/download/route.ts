import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { isSuperAdminUser } from "@/server/super-admin";
import { getTempBackupZip } from "@/server/backup/temp-download-cache";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok || !isSuperAdminUser(auth.user)) {
    return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing download token" }, { status: 400 });
  }

  const cached = getTempBackupZip(token);
  if (!cached) {
    return NextResponse.json(
      { error: "Download link has expired. Manual ZIP downloads are only available for 2 minutes after generation." },
      { status: 410 }
    );
  }

  return new NextResponse(new Uint8Array(cached.zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${cached.fileName}"`,
      "Content-Length": String(cached.zipBuffer.length),
    },
  });
}
