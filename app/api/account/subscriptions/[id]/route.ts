import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json();
  const { quantity, isActive } = body;

  const subscription = await prisma.subscription.findFirst({
    where: { id, userId: user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      ...(quantity != null && { quantity: Number(quantity) }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { product: true },
  });

  return NextResponse.json({
    ...updated,
    product: updated.product
      ? { ...updated.product, price: Number(updated.product.price) }
      : null,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const subscription = await prisma.subscription.findFirst({
    where: { id, userId: user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  await prisma.subscription.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
