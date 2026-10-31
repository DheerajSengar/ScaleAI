import { NextResponse } from "next/server";
import { createPaymentOrder } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, amount, currency, itemDescription, gateway } = body;

    if (!orgId || typeof amount !== "number" || amount <= 0 || !itemDescription) {
      return NextResponse.json(
        { error: "Invalid payment order request: orgId, valid positive amount, and itemDescription are required." },
        { status: 400 }
      );
    }

    const order = await createPaymentOrder({
      orgId,
      amount,
      currency,
      itemDescription,
      gateway
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment order creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
