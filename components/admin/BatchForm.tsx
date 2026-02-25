"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BatchForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [batchDate, setBatchDate] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("10");
  const [subscriptionCap, setSubscriptionCap] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        batchDate,
        quantityAvailable: parseInt(quantityAvailable, 10),
        subscriptionCap: subscriptionCap ? parseInt(subscriptionCap, 10) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.refresh();
    setBatchDate("");
    setQuantityAvailable("10");
    setSubscriptionCap("");
  }

  if (products.length === 0) {
    return (
      <p className="text-gray-500">
        Create a product first before adding batches.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Batch Date
        </label>
        <input
          type="date"
          value={batchDate}
          onChange={(e) => setBatchDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity Available
        </label>
        <input
          type="number"
          min="1"
          value={quantityAvailable}
          onChange={(e) => setQuantityAvailable(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subscription Cap (optional)
        </label>
        <input
          type="number"
          min="0"
          value={subscriptionCap}
          onChange={(e) => setSubscriptionCap(e.target.value)}
          placeholder="Max reserved for subscriptions"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Batch"}
      </button>
    </form>
  );
}
