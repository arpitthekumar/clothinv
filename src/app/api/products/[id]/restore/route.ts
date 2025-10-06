import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../../../_lib/session"; // adjust path if needed

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const auth = await requireAuth();
  
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (auth.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ok = await storage.restoreProduct(params.id);

  if (!ok)
    return NextResponse.json({ error: "Failed to restore product" }, { status: 500 });

  return NextResponse.json({ message: "Product restored successfully" });
}
