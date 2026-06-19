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
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
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
        "Failed to reset password";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ResetPasswordBodyType) => {
    mutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="w-full text-center space-y-4">
        <p className="text-sm text-red-500">Invalid or expired reset link.</p>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
          className="bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl text-base font-semibold"
        >
          Request Again
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Password Reset Successful</h2>
        <p className="text-sm text-gray-400">You can now log in with your new password.</p>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl text-base font-semibold"
        >
          Log In Now
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <input type="hidden" {...register("token")} />

      <div className="space-y-1">
        <label className="text-sm font-bold text-gray-700 block">New Password</label>
        <PasswordInput
          {...register("newPassword")}
          placeholder="Enter new password"
          inputClassName="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400"
        />
        {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-bold text-gray-700 block">Confirm Password</label>
        <PasswordInput
          {...register("confirmPassword")}
          placeholder="Re-enter new password"
          inputClassName="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl text-base font-semibold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" /> Reset Password
          </>
        )}
      </Button>
    </form>
  );
};

export const ResetPasswordForm = () => {
  return (
    <Suspense
      fallback={<div className="w-full py-8 text-center text-sm text-gray-500">Loading...</div>}
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
};
