"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CartItem = {
  productId: string;
  productName: string;
  batchId: string;
  date: string;
  quantity: number;
  price: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    setMounted(true);
  }, []);

  function updateCart(newCart: CartItem[]) {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  }

  function removeItem(index: number) {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  }

  function updateQuantity(index: number, delta: number) {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity < 1) {
      newCart.splice(index, 1);
    }
    updateCart(newCart);
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="bg-white border-b border-amber-100 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-amber-800 hover:text-amber-900">
            ← Back to shop
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link
              href="/"
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, i) => (
              <div
                key={`${item.batchId}-${i}`}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString()} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(i, -1)}
                    className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i, 1)}
                    className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                  <span className="ml-2 font-medium w-16 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-600 text-sm ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full py-3 text-center bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700"
            >
              Proceed to checkout
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
