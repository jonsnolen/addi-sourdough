import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [batches, orders] = await Promise.all([
    prisma.batch.findMany({
      where: { batchDate: { gte: new Date() } },
      include: { product: true },
      orderBy: { batchDate: "asc" },
      take: 10,
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Batches</h2>
          {batches.length === 0 ? (
            <p className="text-gray-500">No upcoming batches.</p>
          ) : (
            <ul className="space-y-2">
              {batches.map((b) => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span>
                    {b.product.name} -{" "}
                    {new Date(b.batchDate).toLocaleDateString()}
                  </span>
                  <span>
                    {b.quantitySold}/{b.quantityAvailable} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/batches"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Manage batches →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="flex justify-between text-sm">
                  <span>
                    {o.user?.email} - {o.items.length} item(s)
                  </span>
                  <span>${Number(o.total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/orders"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            View all orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
