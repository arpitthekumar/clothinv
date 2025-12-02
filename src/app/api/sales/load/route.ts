import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_lib/session";
import { storage } from "@server/storage";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);

  const limit = Number(url.searchParams.get("limit") || 20);
  const cursor = url.searchParams.get("cursor") || null;
  const deleted = url.searchParams.get("deleted") === "true";
  const payment = url.searchParams.get("payment");
  const product = url.searchParams.get("product");
  const search = url.searchParams.get("search");
  const searchBy = url.searchParams.get("searchBy") || "all";
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const category = url.searchParams.get("category");

  const userId = auth.user.role === "admin" ? null : auth.user.id;

  // 🚀 Call filtered storage method
  const { data, nextCursor } = await storage.getSalesFiltered({
    userId,
    limit,
    cursor,
    deleted,
    payment,
    product,
    category,
    start,
    end,
    search,
    searchBy, // ← add this
  });

  return NextResponse.json({
    data,
    nextCursor,
  });
}
