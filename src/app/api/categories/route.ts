import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertCategorySchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const categories = await storage.getCategories();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const data = insertCategorySchema.parse(await req.json());
    const category = await storage.createCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
  }
}


