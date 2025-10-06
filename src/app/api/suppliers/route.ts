import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../_lib/session";
import { storage } from "@server/storage";
import { insertSupplierSchema } from "@shared/schema";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  const suppliers = await storage.getSuppliers();
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });
  if (auth.user.role !== "admin") return NextResponse.json({}, { status: 403 });

  try {
    const body = await req.json();
    const data = insertSupplierSchema.parse(body);
    const created = await storage.createSupplier(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}


