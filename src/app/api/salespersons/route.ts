import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { requireAuth } from "../_lib/session";
import { insertSalespersonSchema } from "@shared/schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  try {
    const list = await storage.getSalespersons(includeInactive);
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch salespersons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = auth.user.role;
  const username = auth.user.username?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin" || username === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only admins and superadmins can create salespersons" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = insertSalespersonSchema.parse(body);
    const salesperson = await storage.createSalesperson(data);
    return NextResponse.json(salesperson, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create salesperson" },
      { status: 400 }
    );
  }
}
