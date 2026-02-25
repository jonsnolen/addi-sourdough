import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { advanceDeliveryDate } from "@/lib/subscription";
import { SubscriptionFrequency } from "@/app/generated/prisma/enums";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      isActive: true,
      nextDeliveryDate: today,
      stripeCustomerId: { not: null },
      stripePaymentMethodId: { not: null },
    },
    include: { product: true },
  });

  const results: { id: string; status: string; error?: string }[] = [];

  for (const sub of subscriptions) {
    const batch = await prisma.batch.findFirst({
      where: {
        productId: sub.productId,
        batchDate: sub.nextDeliveryDate,
      },
    });

    if (!batch) {
      const nextDate = advanceDeliveryDate(
        sub.nextDeliveryDate,
        sub.frequency as SubscriptionFrequency
      );
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDeliveryDate: nextDate },
      });
      results.push({ id: sub.id, status: "skipped_no_batch" });
      continue;
    }

    const available = batch.quantityAvailable - batch.quantitySold;
    if (available < sub.quantity) {
      const nextDate = advanceDeliveryDate(
        sub.nextDeliveryDate,
        sub.frequency as SubscriptionFrequency
      );
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDeliveryDate: nextDate },
      });
      results.push({ id: sub.id, status: "skipped_oversold" });
      continue;
    }

    if (batch.subscriptionCap != null) {
      const existingSubQtyResult = await prisma.orderItem.aggregate({
        where: {
          batchId: batch.id,
          order: {
            subscriptionOrders: { some: { batchId: batch.id } },
          },
        },
        _sum: { quantity: true },
      });
      const existingSubQty = existingSubQtyResult._sum.quantity ?? 0;
      if (existingSubQty + sub.quantity > batch.subscriptionCap) {
        const nextDate = advanceDeliveryDate(
          sub.nextDeliveryDate,
          sub.frequency as SubscriptionFrequency
        );
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextDeliveryDate: nextDate },
        });
        results.push({ id: sub.id, status: "skipped_over_cap" });
        continue;
      }
    }

    try {
      const amount = Math.round(
        Number(sub.product.price) * sub.quantity * 100
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        customer: sub.stripeCustomerId!,
        payment_method: sub.stripePaymentMethodId!,
        off_session: true,
        confirm: true,
        metadata: {
          subscriptionId: sub.id,
          type: "subscription",
        },
      });

      if (paymentIntent.status !== "succeeded") {
        results.push({
          id: sub.id,
          status: "failed",
          error: paymentIntent.status,
        });
        continue;
      }

      const total = Number(sub.product.price) * sub.quantity;

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: sub.userId,
            status: "paid",
            total,
            deliveryDate: sub.nextDeliveryDate,
            stripePaymentIntentId: paymentIntent.id,
          },
        });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            batchId: batch.id,
            productId: sub.productId,
            quantity: sub.quantity,
            priceAtPurchase: sub.product.price,
          },
        });

        await tx.batch.update({
          where: { id: batch.id },
          data: { quantitySold: { increment: sub.quantity } },
        });

        await tx.subscriptionOrder.create({
          data: {
            subscriptionId: sub.id,
            orderId: order.id,
            batchId: batch.id,
            status: "charged",
          },
        });
      });

      const nextDate = advanceDeliveryDate(
        sub.nextDeliveryDate,
        sub.frequency as SubscriptionFrequency
      );
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDeliveryDate: nextDate },
      });

      results.push({ id: sub.id, status: "charged" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const newCount = sub.failedPaymentCount + 1;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          failedPaymentCount: newCount,
          ...(newCount >= 3 && { isActive: false }),
        },
      });
      results.push({ id: sub.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({ processed: results });
}
