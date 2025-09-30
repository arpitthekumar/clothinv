import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertUserSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });
  const users = await storage.getUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const data = insertUserSchema.parse(body);
    const existing = await storage.getUserByUsername(data.username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    const user = await storage.createUser({
      ...data,
      password: await hashPassword(data.password),
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
  }
}


