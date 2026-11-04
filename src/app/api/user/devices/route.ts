import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sessions = await storage.getUserSessions(auth.user.id);
  const currentToken = auth.session.sessionToken;

  const devices = sessions.map((s) => ({
    ...s,
    isCurrentDevice: s.sessionToken === currentToken,
  }));

  return NextResponse.json(
    {
      devices,
      maxAllowed: 2,
    },
    { status: 200 }
  );
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { sessionId, logoutAllOthers } = body;
  const currentToken = auth.session.sessionToken || "";

  if (logoutAllOthers) {
    await storage.deleteAllOtherUserSessions(auth.user.id, currentToken);
    return NextResponse.json({ success: true, message: "Logged out all other devices" });
  }

  if (sessionId) {
    await storage.deleteUserSession(sessionId, auth.user.id);
    return NextResponse.json({ success: true, message: "Device disconnected successfully" });
  }

  return NextResponse.json({ message: "Missing sessionId or logoutAllOthers" }, { status: 400 });
}
