import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({}, { status: 401 });

  try {
    const body = await req.json();
    const { saleId, amount, method } = body || {};
    if (!saleId || !amount) return NextResponse.json({ error: "saleId and amount are required" }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.Key_Id;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.Key_Secret;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: saleId,
        payment_capture: 1,
      }),
    });
    if (!orderRes.ok) {
      const errText = await orderRes.text();
      return NextResponse.json({ error: `Failed to create order: ${errText}` }, { status: 500 });
    }
    const order = await orderRes.json();

    const payment = await storage.createPayment({
      saleId,
      provider: "razorpay",
      orderId: order.id,
      paymentId: null as any,
      status: "created",
      amount: amount.toString(),
      method: method || null,
    } as any);

    return NextResponse.json({ orderId: order.id, keyId, paymentRecordId: payment.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 400 });
  }
}
