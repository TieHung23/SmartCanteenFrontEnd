"use client";

import type { AxiosError } from "axios";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginBodyType, LoginSchema } from "@/types/auth.types";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const LoginForm = () => {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginBodyType>({
    resolver: zodResolver(LoginSchema)
  })
  const loginMutation = useMutation({
    mutationFn: (data: LoginBodyType) => authService.login(data),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.data.token);
      toast.success("Đăng nhập thành công!");
      router.push("/dashboard");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || "Lỗi đăng nhập");
    },
  });

  const onSubmit = (data: LoginBodyType) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <Input
            {...register("email")}
            placeholder="Email"
            className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-base placeholder:text-gray-400"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Input
            type="password"
            {...register("password")}
            placeholder="Password"
            className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-base placeholder:text-gray-400"
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
          <button type="button" className="hover:text-orange-500 transition-colors">
            Forgot password?
          </button>
          <div className="flex gap-1">
            <span>Does not have account?</span>
            <button type="button" className="text-blue-400 hover:underline">
              sign up
            </button>
          </div>
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
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="rounded-xl py-6 flex gap-2 border-gray-200 hover:bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          <span className="text-xs font-semibold">Sign in with Google</span>
        </Button>
        <Button variant="outline" className="rounded-xl py-6 flex gap-2 border-gray-200 hover:bg-gray-50">
          <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center text-[10px] text-white font-bold">M</div>
          <span className="text-xs font-semibold">Sign in with Email</span>
        </Button>
      </div>
    </div>
  );
};