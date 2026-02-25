"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  useEffect(() => {
    if (sessionId) {
      localStorage.removeItem("cart");
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-2xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thank you for your order!
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment was successful. We&apos;ll have your bread ready for pickup.
        </p>
        <Link
          href="/account"
          className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700"
        >
          View order history
        </Link>
        <Link
          href="/"
          className="block mt-4 text-amber-600 hover:text-amber-700"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
