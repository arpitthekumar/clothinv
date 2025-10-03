import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";
import { User } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Dev fallback login
  if (
    process.env.NODE_ENV === "development" &&
    body.username === "admin" &&
    body.password === "admin123"
  ) {
    const session = await getSession();
    session.user = {
      id: "admin-dev-001",
      username: "admin",
      password: "dev",
      role: "admin",
      fullName: "Administrator (Dev)",
      createdAt: new Date(),
    } as User;
    await session.save();
    return NextResponse.json(session.user, { status: 200 });
  }

  // Look up user
  const user = await storage.getUserByUsername(body.username);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Compare password with bcrypt
  const ok = await bcrypt.compare(body.password, user.password);
  if (!ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Save session
  const session = await getSession();
  session.user = user;
  await session.save();

  return NextResponse.json(user, { status: 200 });
}
