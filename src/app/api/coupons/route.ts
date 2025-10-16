import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertDiscountCouponSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const coupons = await storage.getDiscountCoupons();
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const name = (body?.name ?? "").toString().trim().toUpperCase();
    const percentageNum = parseFloat(body?.percentage);
    if (!name || isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      return NextResponse.json({ error: "Invalid name or percentage" }, { status: 400 });
    }
    const data = insertDiscountCouponSchema.parse({
      name,
      percentage: percentageNum.toFixed(2),
      active: true,
      createdBy: auth.user.id,
    });
    const created = await storage.createDiscountCoupon(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const msg = typeof error?.message === "string" ? error.message : "Invalid data";
    if (msg.includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Coupon name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}


