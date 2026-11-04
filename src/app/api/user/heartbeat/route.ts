import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, revoked: (auth as any).revoked || false, message: "Unauthorized or session revoked" },
      { status: 401 }
    );
  }

  const token = auth.session.sessionToken!;
  const body = await req.json().catch(() => ({}));
  const { isBusy, currentOperation } = body;

  await storage.updateHeartbeat(token, isBusy, currentOperation);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}
