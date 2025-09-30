import { NextResponse } from "next/server";
import { getSession } from "../_lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({}, { status: 401 });
  return NextResponse.json(session.user);
}


