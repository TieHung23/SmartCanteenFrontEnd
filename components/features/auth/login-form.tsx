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
import { PasswordInput } from "@/components/ui/password-input";
import { Mail, Lock, AlertCircle, Sparkles } from "lucide-react";

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
    if (!error) return;

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

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Email */}
        <div>
          <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              {...register("email")}
              placeholder="Địa chỉ Email"
              className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Mật khẩu */}
        <div>
          <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <PasswordInput
              {...register("password")}
              placeholder="Mật khẩu"
              inputClassName="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              className="w-full"
            />
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-0.5">
          <button
            type="button"
            onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
            className="text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            Quên mật khẩu?
          </button>
          <div className="flex items-center gap-1">
            <span>Chưa có tài khoản?</span>
            <button
              type="button"
              onClick={() => router.push(ROUTES.REGISTER)}
              className="font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {loginMutation.isPending ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </Button>
      </form>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">HOẶC</span>
        </div>
      </div>

      <div>
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="h-11 w-full rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-3"
        >
          <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
          <span className="text-sm font-bold text-slate-700">Tiếp tục với Google</span>
        </Button>
      </div>
    </div>
  );
};
