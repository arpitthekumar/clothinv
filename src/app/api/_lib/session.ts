import { getIronSession, type IronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { type User } from "@shared/schema";
import { storage } from "@server/storage";
import { parseDeviceName } from "@/lib/device-parser";
import { validateSubscriptionAccess } from "@/server/subscription";

export type SessionData = {
  user?: User;
  sessionToken?: string;
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, {
    password: process.env.SESSION_SECRET!,
    cookieName: "clothinv.sid",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user) {
    return { ok: false as const };
  }

  // Enforce subscription validation for non-superadmin users
  const subCheck = await validateSubscriptionAccess(session.user);
  if (!subCheck.allowed) {
    return { ok: false as const, subscriptionExpired: true, message: subCheck.message };
  }

  // Ensure sessionToken always exists (auto-upgrade legacy sessions)
  if (!session.sessionToken) {
    const sessionToken = crypto.randomUUID();
    const reqHeaders = await headers().catch(() => null);
    const userAgent = reqHeaders?.get("user-agent") || "";
    const ipAddress =
      reqHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      reqHeaders?.get("x-real-ip") ||
      "127.0.0.1";

    await storage.createUserSession({
      userId: session.user.id,
      sessionToken,
      deviceName: parseDeviceName(userAgent),
      ipAddress,
      userAgent,
    });

    session.sessionToken = sessionToken;
    await session.save();
  }

  // Validate active device session token
  const activeSessions = await storage.getUserSessions(session.user.id);
  const currentSessionRecord = activeSessions.find((s) => s.sessionToken === session.sessionToken);

  if (!currentSessionRecord && activeSessions.length > 0) {
    session.destroy();
    return { ok: false as const, revoked: true };
  }

  if (currentSessionRecord?.revokedAt) {
    session.destroy();
    return { ok: false as const, revoked: true };
  }

  // Throttled API activity timestamp update
  storage.updateApiActivity(session.sessionToken).catch(() => {});

  return { ok: true as const, user: session.user, session };
}
