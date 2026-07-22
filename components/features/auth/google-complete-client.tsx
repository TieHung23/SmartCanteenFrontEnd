"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const GoogleCompleteClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const processed = useRef(false);

  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");
  const error = searchParams.get("error");

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    if (error) {
      toast.error(`Lỗi đăng nhập: ${error}`);
      router.push("/login");
      return;
    }
    if (token) {
      login(token, refreshToken || undefined);
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
      return;
    }

    toast.error("Không tìm thấy mã đăng nhập");
    router.push("/login");
  }, [token, refreshToken, error, router, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Đang xử lý đăng nhập...</p>
    </div>
  );
};
