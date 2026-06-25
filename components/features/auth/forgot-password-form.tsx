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
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const AUTH_INPUT_CLASS =
  "h-16 w-full border-0 border-b-2 border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-4 shadow-none text-lg md:text-xl placeholder:text-gray-400";

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
        "Failed to send request";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ForgotPasswordBodyType) => {
    mutation.mutate(data);
  };

  if (sent) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Email Sent</h2>
        <p className="text-sm text-gray-400">
          Check your email and follow the instructions to reset your password.
        </p>
        <Button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl text-base font-semibold"
        >
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <button
        onClick={() => router.push(ROUTES.LOGIN)}
        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-bold text-gray-700 block">Email</label>
          <Input
            {...register("email")}
            placeholder="Enter your email"
            className={AUTH_INPUT_CLASS}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" /> Send Reset Email
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
