"use client";

import type { AxiosError } from "axios";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { LoginBodyType, LoginSchema } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/auth-context";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

const AUTH_INPUT_CLASS =
  "h-11 w-full border-0 border-b-2 border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-3 shadow-none text-base md:text-lg placeholder:text-gray-400";

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_domain_invalid: "Không thể đăng nhập, vui lòng thử lại",
  google_token_error: "Đăng nhập Google thất bại, vui lòng thử lại",
  no_id_token: "Không thể xác minh tài khoản Google, vui lòng đăng nhập lại",
  backend_error: "Đăng nhập Google thất bại trên máy chủ, vui lòng thử lại",
  no_token: "Không thể lấy mã đăng nhập, vui lòng thử lại",
  no_code: "Google không trả về mã xác thực, vui lòng đăng nhập lại",
  server_error: "Lỗi máy chủ, vui lòng thử lại",
};

interface LoginErrorResponse {
  message?: string;
  reason?: string;
  errorCode?: "AccountSuspended" | "AccountBanned" | string;
}

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBodyType>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    const error = searchParams.get("error");

    if (!error) {
      return;
    }

    toast.error(GOOGLE_AUTH_ERROR_MESSAGES[error] ?? "Không thể đăng nhập, vui lòng thử lại");

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("error");
    const nextUrl = nextSearchParams.toString()
      ? `/login?${nextSearchParams.toString()}`
      : "/login";
    window.history.replaceState({}, "", nextUrl);
  }, [searchParams]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginBodyType) => authService.login(data),
    onSuccess: (data) => {
      login(data.value.accessToken, data.value.refreshToken);
      toast.success("Đăng nhập thành công!");
      router.push(ROUTES.HOME);
    },
    onError: (error: AxiosError<LoginErrorResponse>) => {
      const serverMessage = error.response?.data?.message || "Lỗi đăng nhập";
      const reason = error.response?.data?.reason;
      const errorCode = error.response?.data?.errorCode;

      if ((errorCode === "AccountSuspended" || errorCode === "AccountBanned") && reason) {
        toast.error(serverMessage, {
          description: `Lý do: ${reason}`,
          duration: 7000,
        });
        return;
      }

      toast.error(reason ? `${serverMessage}. Lý do: ${reason}` : serverMessage);
    },
  });

  const onSubmit = (data: LoginBodyType) => {
    loginMutation.mutate(data);
  };

  // Google OAuth: redirect to backend handler
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Input {...register("email")} placeholder="Email" className={AUTH_INPUT_CLASS} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <PasswordInput
            {...register("password")}
            placeholder="Mật khẩu"
            inputClassName={AUTH_INPUT_CLASS}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-orange-200 transition-all"
        >
          {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
        <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
          <button
            type="button"
            onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
            className="hover:text-orange-500 transition-colors"
          >
            Quên mật khẩu?
          </button>
          <button
            type="button"
            onClick={() => router.push(ROUTES.VERIFY_EMAIL)}
            className="hover:text-orange-500 transition-colors"
          >
            Xác thực email
          </button>
        </div>
        <div className="flex justify-center gap-1 text-xs text-gray-500 font-medium">
          <span>Chưa có tài khoản?</span>
          <button
            type="button"
            onClick={() => router.push(ROUTES.REGISTER)}
            className="text-blue-400 hover:underline"
          >
            Đăng ký
          </button>
        </div>
      </form>
      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-bold">HOẶC</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white/90 text-slate-700 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <span className="flex items-center gap-3">
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
            <span className="text-sm font-semibold">Tiếp tục với Google</span>
          </span>
        </Button>
      </div>
    </div>
  );
};
