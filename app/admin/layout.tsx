import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="text-amber-800 font-semibold hover:text-amber-900"
            >
              Addi&apos;s Sourdough
            </Link>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="text-gray-600 hover:text-gray-900"
            >
              Products
            </Link>
            <Link
              href="/admin/batches"
              className="text-gray-600 hover:text-gray-900"
            >
              Batches
            </Link>
          </div>
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
            View Shop
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
