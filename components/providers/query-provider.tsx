"use client"; // Bắt buộc vì Provider dùng hook (useState)

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
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

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
