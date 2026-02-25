"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const productId = searchParams.get("productId");
    const quantity = searchParams.get("quantity");
    const frequency = searchParams.get("frequency");
    const startDate = searchParams.get("startDate");

    if (!sessionId || !productId || !quantity || !frequency) {
      setStatus("error");
      setError("Missing parameters");
      return;
    }

    fetch("/api/subscriptions/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutSessionId: sessionId,
        productId,
        quantity,
        frequency,
        startDate,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setError(data.error || "Failed to create subscription");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Network error");
      });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Setting up your subscription...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/account" className="text-amber-600 hover:underline">
          Go to account
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="text-2xl mb-4">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Subscription active!
      </h1>
      <p className="text-gray-600 mb-6">
        You&apos;ll be charged automatically before each delivery.
      </p>
      <Link
        href="/account"
        className="inline-block px-6 py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700"
      >
        View subscription
      </Link>
    </div>
  );
}

export default function SubscribeConfirmPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <Suspense fallback={<p>Loading...</p>}>
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  );
}
