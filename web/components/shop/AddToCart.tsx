"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Availability = { batchId: string; date: string; available: number };

export function AddToCart({
  productId,
  productName,
  price,
}: {
  productId: string;
  productName: string;
  price: number;
}) {
  const router = useRouter();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(
      `/api/shop/availability?productId=${productId}&from=${new Date().toISOString().slice(0, 10)}`
    )
      .then((r) => r.json())
      .then((data) => {
        setAvailability(data);
        if (data.length > 0 && !selectedDate) {
          setSelectedDate(data[0].date);
        }
      })
      .finally(() => setLoading(false));
  }, [productId, selectedDate]);

  const selectedBatch = availability.find((a) => a.date === selectedDate);
  const maxQty = selectedBatch?.available ?? 0;

  function handleAddToCart() {
    if (!selectedDate || !selectedBatch || quantity < 1 || quantity > maxQty)
      return;
    setAdding(true);

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.findIndex(
      (i: { productId: string; batchId: string }) =>
        i.productId === productId && i.batchId === selectedBatch.batchId
    );

    const item = {
      productId,
      productName,
      batchId: selectedBatch.batchId,
      date: selectedDate,
      quantity,
      price,
    };

    if (existing >= 0) {
      cart[existing].quantity += quantity;
    } else {
      cart.push(item);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setAdding(false);
    router.push("/cart");
  }

  if (loading) {
    return <p className="text-gray-500">Loading availability...</p>;
  }

  if (availability.length === 0) {
    return (
      <p className="text-gray-500">
        No delivery dates available. Check back for upcoming batches.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery date
        </label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {availability.map((a) => (
            <option key={a.batchId} value={a.date}>
              {new Date(a.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              ({a.available} available)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          max={maxQty}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          className="w-24 px-3 py-2 border border-gray-300 rounded-md"
        />
        <span className="ml-2 text-sm text-gray-500">
          (max {maxQty})
        </span>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={adding || quantity < 1 || quantity > maxQty}
        className="w-full py-3 px-4 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
      >
        {adding ? "Adding..." : `Add to cart ($${(price * quantity).toFixed(2)})`}
      </button>
    </div>
  );
}
