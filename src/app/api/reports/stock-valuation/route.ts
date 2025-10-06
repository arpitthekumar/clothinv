import { NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const data = await storage.getStockValuation();
  return NextResponse.json(data);
}


