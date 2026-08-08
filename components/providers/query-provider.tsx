"use client"; // Bắt buộc vì Provider dùng hook (useState)

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        if (
          typeof args[0] === "string" &&
          args[0].includes("THREE.Clock: This module has been deprecated")
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  }, []);

  // Tạo QueryClient 1 lần duy nhất, không tạo lại mỗi lần render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Không tự động refetch khi chuyển tab trình duyệt
            refetchOnWindowFocus: false,
            // Thử lại 1 lần nếu API lỗi
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
