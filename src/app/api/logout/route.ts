import { NextResponse } from "next/server";
import { getSession } from "../_lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({}, { status: 200 });
}


