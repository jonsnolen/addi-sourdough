"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Batch = {
  id: string;
  productId: string;
  productName: string;
  batchDate: string;
  quantityAvailable: number;
  quantitySold: number;
  subscriptionCap: number | null;
};

export function BatchesList({ batches }: { batches: Batch[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [error, setError] = useState("");

  async function handleUpdate(id: string) {
    setError("");
    const res = await fetch(`/api/admin/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantityAvailable: parseInt(editQty, 10) }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this batch?")) return;
    setError("");
    const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Delete failed");
      return;
    }

    router.refresh();
  }

  if (batches.length === 0) {
    return (
      <p className="p-4 text-gray-500">No upcoming batches. Create one above.</p>
    );
  }

  return (
    <div className="divide-y">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {batches.map((b) => (
        <div
          key={b.id}
          className="flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div>
            <span className="font-medium">{b.productName}</span>
            <span className="text-gray-500 ml-2">
              {new Date(b.batchDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {editingId === b.id ? (
              <>
                <input
                  type="number"
                  min={b.quantitySold}
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => handleUpdate(b.id)}
                  className="text-amber-600 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  {b.quantitySold}/{b.quantityAvailable} sold
                  {b.subscriptionCap != null && ` (cap: ${b.subscriptionCap})`}
                </span>
                <button
                  onClick={() => {
                    setEditingId(b.id);
                    setEditQty(String(b.quantityAvailable));
                  }}
                  className="text-amber-600 text-sm font-medium"
                >
                  Edit
                </button>
                {b.quantitySold === 0 && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
