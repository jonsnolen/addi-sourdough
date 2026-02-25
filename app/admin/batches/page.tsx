import { BatchForm } from "@/components/admin/BatchForm";
import { BatchesList } from "@/components/admin/BatchesList";
import { prisma } from "@/lib/db";

export default async function AdminBatchesPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const batches = await prisma.batch.findMany({
    where: { batchDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: { product: true },
    orderBy: { batchDate: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Batches</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Create Batch</h2>
        <BatchForm products={products.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Upcoming Batches</h2>
        <BatchesList
          batches={batches.map((b) => ({
            id: b.id,
            productId: b.productId,
            productName: b.product.name,
            batchDate: b.batchDate.toISOString().slice(0, 10),
            quantityAvailable: b.quantityAvailable,
            quantitySold: b.quantitySold,
            subscriptionCap: b.subscriptionCap,
          }))}
        />
      </div>
    </div>
  );
}
