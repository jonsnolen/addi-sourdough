import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const where: { batchDate?: { gte?: Date; lte?: Date } } = {};
  if (fromDate) {
    where.batchDate = { ...where.batchDate, gte: new Date(fromDate) };
  }
  if (toDate) {
    where.batchDate = { ...where.batchDate, lte: new Date(toDate) };
  }

  const batches = await prisma.batch.findMany({
    where,
    include: { product: true },
    orderBy: { batchDate: "asc" },
  });

  return NextResponse.json(
    batches.map((b) => ({
      ...b,
      product: b.product
        ? { ...b.product, price: Number(b.product.price) }
        : null,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, batchDate, quantityAvailable, subscriptionCap } = body;

  if (!productId || !batchDate || quantityAvailable == null) {
    return NextResponse.json(
      { error: "productId, batchDate, and quantityAvailable are required" },
      { status: 400 }
    );
  }

  const date = new Date(batchDate);
  date.setHours(0, 0, 0, 0);

  const existing = await prisma.batch.findUnique({
    where: {
      productId_batchDate: { productId, batchDate: date },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Batch already exists for this product and date" },
      { status: 400 }
    );
  }

  const batch = await prisma.batch.create({
    data: {
      productId,
      batchDate: date,
      quantityAvailable: Number(quantityAvailable),
      subscriptionCap: subscriptionCap != null ? Number(subscriptionCap) : null,
    },
    include: { product: true },
  });

  return NextResponse.json({
    ...batch,
    product: batch.product
      ? { ...batch.product, price: Number(batch.product.price) }
      : null,
  });
}
