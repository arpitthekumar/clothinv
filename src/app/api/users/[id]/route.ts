import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../_lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string }}) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });
  const ok = await storage.deleteUser(params.id);
  if (!ok) return NextResponse.json({}, { status: 404 });
  return NextResponse.json({}, { status: 204 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string }}) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });
  const body = await req.json();
  const user = await storage.updateUser(params.id, body);
  if (!user) return NextResponse.json({}, { status: 404 });
  return NextResponse.json(user);
}


