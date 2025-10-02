import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  const body = await req.json();
  const user = await storage.updateUser(id, body);
  if (!user) return NextResponse.json({}, { status: 404 });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ await params
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  const ok = await storage.deleteUser(id);
  if (!ok) return NextResponse.json({}, { status: 404 });

  // ✅ Fix invalid 204 response
  return new NextResponse(null, { status: 204 });
}
