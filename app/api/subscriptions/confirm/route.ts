import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { SubscriptionFrequency } from "@/app/generated/prisma/enums";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { checkoutSessionId, productId, quantity, frequency, startDate } = body;

  if (!checkoutSessionId || !productId || !quantity || !frequency) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(
    checkoutSessionId,
    { expand: ["setup_intent"] }
  );

  if (checkoutSession.mode !== "setup") {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 400 }
    );
  }

  const setupIntent = checkoutSession.setup_intent;
  if (!setupIntent || typeof setupIntent === "string") {
    return NextResponse.json(
      { error: "No payment method" },
      { status: 400 }
    );
  }

  const paymentMethod =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "No payment method" },
      { status: 400 }
    );
  }

  let customerId = checkoutSession.customer as string | null;
  if (!customerId && checkoutSession.customer_email) {
    const customer = await stripe.customers.create({
      email: checkoutSession.customer_email,
    });
    customerId = customer.id;
  }
  if (customerId) {
    try {
      await stripe.paymentMethods.attach(paymentMethod, {
        customer: customerId,
      });
    } catch {
      // Payment method may already be attached
    }
  }

  const start = startDate
    ? new Date(startDate)
    : new Date();
  start.setHours(0, 0, 0, 0);

  const freqMap = {
    weekly: SubscriptionFrequency.weekly,
    biweekly: SubscriptionFrequency.biweekly,
    monthly: SubscriptionFrequency.monthly,
  };

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      productId,
      quantity: parseInt(quantity, 10),
      frequency: freqMap[frequency as keyof typeof freqMap] ?? SubscriptionFrequency.weekly,
      nextDeliveryDate: start,
      stripeCustomerId: customerId,
      stripePaymentMethodId: paymentMethod,
    },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    nextDeliveryDate: subscription.nextDeliveryDate,
  });
}
