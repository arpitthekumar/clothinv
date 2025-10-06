import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    const { paymentId, orderId, signature, paymentRecordId } = body || {};
    if (!paymentRecordId || !paymentId || !orderId || !signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // TODO: Verify signature using Razorpay key secret on server
    const verified = true; // placeholder

    const updated = await storage.updatePayment(paymentRecordId, {
      paymentId,
      status: verified ? "captured" : "failed",
    } as any);

    return NextResponse.json({ ok: true, status: updated?.status }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 400 });
  }
}
