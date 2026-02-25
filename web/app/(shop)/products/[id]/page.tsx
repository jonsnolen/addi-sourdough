import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AddToCart } from "@/components/shop/AddToCart";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
  });

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <a href="/" className="text-amber-800 hover:text-amber-900">
            ← Back to shop
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square bg-white rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-100">
                <span className="text-9xl text-amber-300">🍞</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-2xl font-semibold text-amber-800 mt-2">
              ${Number(product.price).toFixed(2)}
            </p>
            {product.description && (
              <p className="text-gray-600 mt-4">{product.description}</p>
            )}
            <div className="mt-8 space-y-4">
              <AddToCart
                productId={product.id}
                productName={product.name}
                price={Number(product.price)}
              />
              <a
                href={`/products/${product.id}/subscribe`}
                className="block w-full py-3 text-center border-2 border-amber-600 text-amber-600 font-medium rounded-md hover:bg-amber-50"
              >
                Subscribe (weekly, bi-weekly, or monthly)
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
