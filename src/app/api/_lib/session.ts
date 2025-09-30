import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { type User } from "@shared/schema";

export type SessionData = {
  user?: User;
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
  return { ok: true as const, user: session.user, session };
}


