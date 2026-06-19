import { Suspense } from "react";
import RefundForm from "@/components/features/refund/refund-form";

export default function RefundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
        </div>
      }
    >
      <RefundForm />
    </Suspense>
  );
}
