import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = from ? new Date(from) : today;
  const toDate = to
    ? new Date(to)
    : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const batches = await prisma.batch.findMany({
    where: {
      productId,
      batchDate: { gte: fromDate, lte: toDate },
    },
    orderBy: { batchDate: "asc" },
  });

  const availability = batches
    .filter((b) => b.quantityAvailable - b.quantitySold > 0)
    .map((b) => ({
      batchId: b.id,
      date: b.batchDate.toISOString().slice(0, 10),
      available: b.quantityAvailable - b.quantitySold,
    }));

  return NextResponse.json(availability);
}
