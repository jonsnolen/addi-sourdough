import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <a href="/cart" className="text-amber-800 hover:text-amber-900">
            ← Back to cart
          </a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <CheckoutForm user={user} />
      </main>
    </div>
  );
}
