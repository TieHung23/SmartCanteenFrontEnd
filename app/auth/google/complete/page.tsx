import { Suspense } from "react";
import { GoogleCompleteClient } from "@/components/features/auth/google-complete-client";

export default function GoogleCompletePage() {
  return (
    <Suspense
        fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg">Processing sign-in...</p>
        </div>
      }
    >
      <GoogleCompleteClient />
    </Suspense>
  );
}
