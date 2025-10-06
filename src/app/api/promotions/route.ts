import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertPromotionSchema, insertPromotionTargetSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  const promos = await storage.getPromotions();
  return NextResponse.json(promos);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const promo = insertPromotionSchema.parse(body);
    const created = await storage.createPromotion(promo);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const target = insertPromotionTargetSchema.parse(body);
    const created = await storage.addPromotionTarget(target);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}


