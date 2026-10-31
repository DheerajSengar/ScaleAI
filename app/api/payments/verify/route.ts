import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, gatewayPaymentId, gatewaySignature, gateway } = body;

    if (!orderId || !gatewayPaymentId || !gateway) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, gatewayPaymentId, and gateway are required." },
        { status: 400 }
      );
    }

    const result = await verifyAndSettlePayment({
      orderId,
      gatewayPaymentId,
      gatewaySignature,
      gateway
    });

    return NextResponse.json({ success: true, planUpgraded: result.planUpgraded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
