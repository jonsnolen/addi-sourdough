import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";

export default async function ShopPage() {
  const [products, user] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-amber-900"
          >
            Addi&apos;s Sourdough
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-amber-800 hover:text-amber-900">
              Cart
            </Link>
            {user ? (
              <>
                <Link href="/account" className="text-amber-800 hover:text-amber-900">
                  Account
                </Link>
                {(user as { role?: string }).role === "admin" && (
                  <Link href="/admin" className="text-amber-800 hover:text-amber-900">
                    Admin
                  </Link>
                )}
                <form action="/api/auth/signout" method="POST">
                  <button type="submit" className="text-gray-600 hover:text-gray-900 text-sm">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-amber-800 hover:text-amber-900">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">
            Homemade Sourdough Bread
          </h1>
          <p className="text-amber-800/80">
            Baked fresh each weekend. Order for pickup or delivery.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {product.imageUrl ? (
                <div className="aspect-square relative bg-amber-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-amber-100 flex items-center justify-center">
                  <span className="text-6xl text-amber-300">🍞</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg text-gray-900">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 font-medium text-amber-800">
                  ${Number(product.price).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p>No products available yet. Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
