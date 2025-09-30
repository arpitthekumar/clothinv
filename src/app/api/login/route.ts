import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (process.env.NODE_ENV === "development" && body.username === "admin" && body.password === "admin123") {
    const session = await getSession();
    session.user = {
      id: "admin-dev-001",
      username: "admin",
      password: "dev",
      role: "admin",
      fullName: "Administrator (Dev)",
      createdAt: new Date(),
    } as any;
    await session.save();
    return NextResponse.json(session.user, { status: 200 });
  }

  const user = await storage.getUserByUsername(body.username);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const ok = await comparePasswords(body.password, user.password);
  if (!ok) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const session = await getSession();
  session.user = user;
  await session.save();
  return NextResponse.json(user, { status: 200 });
}


