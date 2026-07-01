"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("The system has caught the error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-red-50 text-center">
      <div className="text-red-500 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>

      <p className="text-gray-600 mb-8 max-w-md">Đã xảy ra lỗi. Vui lòng thử lại sau.</p>

      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-5 shadow-md"
        >
          Thử lại
        </Button>

        {/* Nút về trang chủ */}
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
          className="rounded-full px-6 py-5 border-red-200 text-red-500 hover:bg-red-100"
        >
          Trang chủ
        </Button>
      </div>
    </div>
  );
}
