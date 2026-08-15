"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RefundForm from "@/components/features/refund/refund-form";
import CustomerRefundsPage from "@/app/(main)/refunds/page";

function RefundPageInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return <CustomerRefundsPage />;
  }

  return <RefundForm />;
}

export default function RefundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
        </div>
      }
    >
      <RefundPageInner />
    </Suspense>
  );
}
