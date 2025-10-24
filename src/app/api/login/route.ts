import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";
import { User } from "@shared/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Local dev bypass
  if (process.env.NODE_ENV === "development" && body.username === "admin" && body.password === "admin123") {
    const session = await getSession();
    session.user = {
      id: "admin-dev-001",
      username: "admin",
      password: "admin123",
      role: "admin",
      fullName: "Administrator (Dev)",
      createdAt: new Date(),
    } as User;
    await session.save();
    return NextResponse.json(session.user, { status: 200 });
  }

  // Fetch user from DB
  const user = await storage.getUserByUsername(body.username);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized - User not found" }, { status: 401 });
  }

  // Plain text password check (no hashing)
  if (user.password !== body.password) {
    return NextResponse.json({ message: "Unauthorized - Wrong password" }, { status: 401 });
  }

  // Save session
  const session = await getSession();
  session.user = user;
  await session.save();

  return NextResponse.json(user, { status: 200 });
}
