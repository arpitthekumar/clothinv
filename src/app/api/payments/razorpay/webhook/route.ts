import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload?.event;
    const entity = payload?.payload?.payment?.entity;

    if (!event || !entity) return NextResponse.json({ ok: true });

    // Match payment by order_id if available
    const orderId = entity?.order_id as string | undefined;
    const paymentId = entity?.id as string | undefined;

    if (orderId && paymentId) {
      // Ideally, look up payment record by orderId; here we update by matching order id if we had an index
      // For simplicity, require client to send paymentRecordId via verify endpoint for finalization.
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 400 });
  }
}
