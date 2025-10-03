import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";
import { insertUserSchema } from "@shared/schema";

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

    // Check if username exists
    const existing = await storage.getUserByUsername(data.username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Save plain text password
    const user = await storage.createUser({
      ...data,
      password: data.password, // 👈 no hashing
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
  }
}
