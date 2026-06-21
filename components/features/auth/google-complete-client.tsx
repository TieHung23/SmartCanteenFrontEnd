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
      toast.error(`Login error: ${error}`);
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

    toast.error("Token not found");
    router.push("/login");
  }, [token, refreshToken, error, router, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Processing sign-in...</p>
    </div>
  );
};
