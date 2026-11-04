import { NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";

export async function POST() {
  const session = await getSession();

  if (session.user && session.sessionToken) {
    await storage.deleteUserSession(session.sessionToken, session.user.id).catch(() => {});
  }

  session.destroy();
  return NextResponse.json({ success: true }, { status: 200 });
}
