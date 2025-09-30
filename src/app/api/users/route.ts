import { NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });
  const users = await storage.getUsers();
  return NextResponse.json(users);
}


