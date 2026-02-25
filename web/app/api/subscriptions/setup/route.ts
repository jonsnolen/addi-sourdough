import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

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
  const { productId, quantity, frequency, startDate } = body;

  if (!productId || !quantity || !frequency) {
    return NextResponse.json(
      { error: "productId, quantity, and frequency are required" },
      { status: 400 }
    );
  }

  const validFreq = ["weekly", "biweekly", "monthly"];
  if (!validFreq.includes(frequency)) {
    return NextResponse.json(
      { error: "Invalid frequency" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const start = startDate
    ? new Date(startDate)
    : getNextSaturday(new Date());
  start.setHours(0, 0, 0, 0);

  const sessionUrl = await stripe.checkout.sessions.create({
    mode: "setup",
    payment_method_types: ["card"],
    success_url: `${process.env.NEXTAUTH_URL}/subscriptions/confirm?session_id={CHECKOUT_SESSION_ID}&productId=${productId}&quantity=${quantity}&frequency=${frequency}&startDate=${start.toISOString().slice(0, 10)}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/products/${productId}`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      productId,
      quantity: String(quantity),
      frequency,
      startDate: start.toISOString().slice(0, 10),
    },
  });

  return NextResponse.json({ url: sessionUrl.url });
}

function getNextSaturday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  if (daysUntilSaturday === 0 && d <= from) {
    d.setDate(d.getDate() + 7);
  } else {
    d.setDate(d.getDate() + daysUntilSaturday);
  }
  return d;
}
