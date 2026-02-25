"use client";

import { useState, useEffect } from "react";

type CartItem = {
  productId: string;
  productName: string;
  batchId: string;
  date: string;
  quantity: number;
  price: number;
};

type User = {
  name?: string | null;
  email?: string | null;
};

export function CheckoutForm({ user }: { user: User }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        address: address || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Checkout failed");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("No checkout URL received");
    }
  }

  if (!mounted) {
    return <p>Loading...</p>;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Your cart is empty.</p>
        <a href="/" className="text-amber-600 hover:underline mt-2 inline-block">
          Browse products
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Order summary</h2>
        <ul className="space-y-2">
          {cart.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>
                {item.productName} × {item.quantity} (
                {new Date(item.date).toLocaleDateString()})
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="font-semibold mt-4 flex justify-between">
          Total <span>${total.toFixed(2)}</span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Delivery details</h2>
        <p className="text-sm text-gray-600 mb-2">
          Ordering as {user.email}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery address (optional)
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Pickup location or delivery address"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay with Stripe"}
      </button>
    </form>
  );
}
