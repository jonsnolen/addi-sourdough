import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, price, imageUrl } = body;

  if (!name || price == null) {
    return NextResponse.json(
      { error: "Name and price are required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      price: Number(price),
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({
    ...product,
    price: Number(product.price),
  });
}
