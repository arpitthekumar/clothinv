import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const url = new URL(request.url);
  const sinceDays = parseInt(url.searchParams.get("sinceDays") || "30", 10);
  const data = await storage.getProfitMargins({ sinceDays });
  return NextResponse.json(data);
}


