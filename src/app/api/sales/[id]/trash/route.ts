import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can move sales to trash" },
      { status: 403 }
    );
  }

  const saleId = params.id;
  if (!saleId) {
    return NextResponse.json(
      { error: "Sale ID is required" },
      { status: 400 }
    );
  }

  try {
    await storage.softDeleteSale(saleId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error moving sale to trash:", error);
    return NextResponse.json(
      { error: error.message || "Failed to move sale to trash" },
      { status: 500 }
    );
  }
}