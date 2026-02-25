import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { SubscriptionManager } from "@/components/account/SubscriptionManager";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/account");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  const [orders, subscriptions] = await Promise.all([
    prisma.order.findMany({
      where: { userId: dbUser!.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
      take: 20,
    }),
    prisma.subscription.findMany({
      where: { userId: dbUser!.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-amber-800 hover:text-amber-900">
            ← Back to shop
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Account</h1>
        <p className="text-gray-600 mb-8">{user.email}</p>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p className="text-gray-500">No active subscriptions.</p>
          ) : (
            <SubscriptionManager
              subscriptions={subscriptions.map((s) => ({
                id: s.id,
                productName: s.product.name,
                quantity: s.quantity,
                frequency: s.frequency,
                nextDeliveryDate: s.nextDeliveryDate.toISOString().slice(0, 10),
                isActive: s.isActive,
              }))}
            />
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders yet.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-700">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product.name} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">
                    ${Number(order.total).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
