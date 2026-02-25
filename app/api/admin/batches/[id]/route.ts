import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { quantityAvailable, subscriptionCap } = body;

  const batch = await prisma.batch.findUnique({
    where: { id },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (quantityAvailable != null) {
    const newQty = Number(quantityAvailable);
    if (newQty < batch.quantitySold) {
      return NextResponse.json(
        {
          error: `Cannot reduce below ${batch.quantitySold} (already sold). Consider cancelling orders first.`,
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.batch.update({
    where: { id },
    data: {
      ...(quantityAvailable != null && {
        quantityAvailable: Number(quantityAvailable),
      }),
      ...(subscriptionCap !== undefined && {
        subscriptionCap:
          subscriptionCap === null ? null : Number(subscriptionCap),
      }),
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
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const batch = await prisma.batch.findUnique({ where: { id } });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (batch.quantitySold > 0) {
    return NextResponse.json(
      { error: "Cannot delete batch with existing orders" },
      { status: 400 }
    );
  }

  await prisma.batch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
