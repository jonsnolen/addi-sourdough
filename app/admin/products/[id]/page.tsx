import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price),
          imageUrl: product.imageUrl ?? "",
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
