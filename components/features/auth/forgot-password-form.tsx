"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ForgotPasswordSchema, type ForgotPasswordBodyType } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordBodyType>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordBodyType) => authService.forgotPassword(data),
    onSuccess: () => setSent(true),
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Không thể gửi yêu cầu";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ForgotPasswordBodyType) => {
    mutation.mutate(data);
  };

  if (sent) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">Đã gửi email thành công!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vui lòng kiểm tra hòm thư Email của bạn và nhấp vào liên kết để tiến hành đặt lại mật
            khẩu.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              {...register("email")}
              placeholder="Nhập địa chỉ Email của bạn"
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

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gửi email...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Gửi liên kết đặt lại mật khẩu</span>
            </>
          )}
        </Button>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang đăng nhập</span>
        </button>
      </div>
    </div>
  );
};
