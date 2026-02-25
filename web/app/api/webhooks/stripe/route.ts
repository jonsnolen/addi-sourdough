import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (existingOrder) {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata;
    if (!metadata?.userId || !metadata?.items) {
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    const items = JSON.parse(metadata.items) as {
      productId: string;
      productName: string;
      batchId: string;
      date: string;
      quantity: number;
      price: number;
    }[];

    const deliveryDate = new Date(metadata.deliveryDate || items[0]?.date);
    deliveryDate.setHours(0, 0, 0, 0);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: metadata.userId,
          status: "paid",
          total,
          deliveryDate,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string | null,
        },
      });

      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            batchId: item.batchId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          },
        });

        await tx.batch.update({
          where: { id: item.batchId },
          data: {
            quantitySold: { increment: item.quantity },
          },
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
