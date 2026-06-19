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
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_domain_invalid: "Unable to sign in, please try again",
  google_token_error: "Google sign-in failed, please try again",
  no_id_token: "Unable to verify Google account, please sign in again",
  backend_error: "Google sign-in failed on server, please try again",
  no_token: "Unable to retrieve sign-in token, please try again",
  no_code: "Google did not return an auth code, please sign in again",
  server_error: "Server error, please try again",
};

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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

    toast.error(GOOGLE_AUTH_ERROR_MESSAGES[error] ?? "Unable to sign in, please try again");

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
      localStorage.setItem("accessToken", data.value.accessToken);
      toast.success("Signed in successfully!");
      router.push(ROUTES.HOME);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const serverMessage = error.response?.data?.message || "Login error";
      toast.error(serverMessage);
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
    <div className="w-full space-y-10">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <Input
            {...register("email")}
            placeholder="Email"
            className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <PasswordInput
            {...register("password")}
            placeholder="Password"
            inputClassName="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400"
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl text-lg font-semibold shadow-lg shadow-orange-200 transition-all"
        >
          {loginMutation.isPending ? "Signing In..." : "Sign In"}
        </Button>
        <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
          <button
            type="button"
            onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
            className="hover:text-orange-500 transition-colors"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => router.push(ROUTES.VERIFY_EMAIL)}
            className="hover:text-orange-500 transition-colors"
          >
            Verify email
          </button>
        </div>
        <div className="flex justify-center gap-1 text-xs text-gray-500 font-medium">
          <span>Does not have account?</span>
          <button
            type="button"
            onClick={() => router.push(ROUTES.REGISTER)}
            className="text-blue-400 hover:underline"
          >
            Sign up
          </button>
        </div>
      </form>
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-bold">OR</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          className="h-12 w-full rounded-xl border border-gray-200 bg-white/90 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <span className="flex items-center gap-3">
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
            <span className="text-sm font-semibold">Continue with Google</span>
          </span>
        </Button>
      </div>
    </div>
  );
};
