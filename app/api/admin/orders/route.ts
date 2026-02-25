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
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
  });

  return NextResponse.json(
    orders.map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items.map((i) => ({
        ...i,
        priceAtPurchase: Number(i.priceAtPurchase),
        product: i.product
          ? { ...i.product, price: Number(i.product.price) }
          : null,
      })),
    }))
  );
}
