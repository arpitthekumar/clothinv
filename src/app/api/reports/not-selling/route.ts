import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const url = new URL(request.url);
  const sinceDays = parseInt(url.searchParams.get("sinceDays") || "30", 10);

  // Fetch all not selling products including deleted fields
  const data = await storage.getNotSellingProducts({ sinceDays });

  // Filter out soft-deleted products
  const activeProducts = data.filter(
    (p: any) => !p.deleted && !p.deleted_at
  );

  return NextResponse.json(activeProducts);
}
