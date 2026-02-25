import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type CartItem = {
  productId: string;
  productName: string;
  batchId: string;
  date: string;
  quantity: number;
  price: number;
};

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
  const { items, address } = body as { items: CartItem[]; address?: string };

  if (!items?.length) {
    return NextResponse.json(
      { error: "Cart is empty" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Validate availability
  for (const item of items) {
    const batch = await prisma.batch.findUnique({
      where: { id: item.batchId },
    });
    if (!batch) {
      return NextResponse.json(
        { error: `Batch not found for ${item.productName}` },
        { status: 400 }
      );
    }
    const available = batch.quantityAvailable - batch.quantitySold;
    if (item.quantity > available) {
      return NextResponse.json(
        { error: `Only ${available} available for ${item.productName} on ${item.date}` },
        { status: 400 }
      );
    }
  }

  const deliveryDate = items[0]?.date;

  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.productName,
        description: `Delivery: ${new Date(item.date).toLocaleDateString()}`,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/cart`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      deliveryDate,
      items: JSON.stringify(items),
      address: address || "",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
