"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ResetPasswordSchema, type ResetPasswordBodyType } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, Lock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";

const ResetPasswordFormInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordBodyType>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordBodyType) => authService.resetPassword(data),
    onSuccess: () => setDone(true),
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Không thể đặt lại mật khẩu";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ResetPasswordBodyType) => {
    mutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="w-full text-center space-y-4">
        <p className="text-sm text-red-500 font-medium">
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
          className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
        >
          Yêu cầu lại liên kết mới
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">Đặt lại mật khẩu thành công!</h2>
          <p className="text-xs text-slate-500">
            Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới để đăng
            nhập.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
      <input type="hidden" {...register("token")} />

      {/* Mật khẩu mới */}
      <div>
        <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <PasswordInput
            {...register("newPassword")}
            placeholder="Nhập mật khẩu mới"
            inputClassName="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
            className="w-full"
          />
        </div>
        {errors.newPassword && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* Xác nhận mật khẩu */}
      <div>
        <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <PasswordInput
            {...register("confirmPassword")}
            placeholder="Xác nhận mật khẩu mới"
            inputClassName="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
            className="w-full"
          />
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Đặt lại mật khẩu</span>
          </>
        )}
      </Button>
    </form>
  );
};

export const ResetPasswordForm = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full py-8 text-center text-xs text-slate-400 font-medium">
          Đang tải...
        </div>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
};
