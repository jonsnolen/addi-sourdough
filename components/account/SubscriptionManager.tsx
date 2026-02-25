"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Subscription = {
  id: string;
  productName: string;
  quantity: number;
  frequency: string;
  nextDeliveryDate: string;
  isActive: boolean;
};

export function SubscriptionManager({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate(id: string, quantity: number) {
    setLoading(true);
    const res = await fetch(`/api/account/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    setLoading(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handlePause(id: string) {
    setLoading(true);
    await fetch(`/api/account/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleResume(id: string) {
    setLoading(true);
    await fetch(`/api/account/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this subscription? You won't be charged again.")) return;
    setLoading(true);
    await fetch(`/api/account/subscriptions/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  const freqLabel: Record<string, string> = {
    weekly: "Every week",
    biweekly: "Every other week",
    monthly: "Every month",
  };

  return (
    <ul className="space-y-4">
      {subscriptions.map((sub) => (
        <li key={sub.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{sub.productName}</p>
              <p className="text-sm text-gray-600">
                {sub.quantity} × {freqLabel[sub.frequency] ?? sub.frequency}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Next: {new Date(sub.nextDeliveryDate).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                sub.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {sub.isActive ? "Active" : "Paused"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {editingId === sub.id ? (
              <>
                <input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-16 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => handleUpdate(sub.id, parseInt(editQty, 10))}
                  disabled={loading}
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
                <button
                  onClick={() => {
                    setEditingId(sub.id);
                    setEditQty(String(sub.quantity));
                  }}
                  className="text-amber-600 text-sm font-medium"
                >
                  Change quantity
                </button>
                {sub.isActive ? (
                  <button
                    onClick={() => handlePause(sub.id)}
                    disabled={loading}
                    className="text-gray-600 text-sm"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleResume(sub.id)}
                    disabled={loading}
                    className="text-amber-600 text-sm font-medium"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleCancel(sub.id)}
                  disabled={loading}
                  className="text-red-600 text-sm"
                >
                  Cancel subscription
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
