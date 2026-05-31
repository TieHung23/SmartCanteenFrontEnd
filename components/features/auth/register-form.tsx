"use client";

import type { AxiosError } from "axios";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ROUTES } from "@/config/routes";
import { authService } from "@/services/auth.service";
import { RegisterBodyType, RegisterSchema } from "@/types/auth.types";

export const RegisterForm = () => {
  const router = useRouter();
  const getError = (key: string) => (errors as unknown as Record<string, { message?: string } | undefined>)[key]?.message;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterBodyType & Record<string, unknown>>({
    resolver: zodResolver(RegisterSchema) as never,
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterBodyType) => authService.register(data),
    onSuccess: (data) => {
      toast.success(
        data.message || "Registration successful. Please check your email and verify your account before signing in."
      );
      router.push(ROUTES.LOGIN);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });

  const onSubmit = (data: RegisterBodyType) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="hidden"
          defaultValue={1}
          {...register("category", { valueAsNumber: true })}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Input
              {...register("name")}
              placeholder="Name"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("name") && <p className="text-xs text-red-500">{getError("name")}</p>}
          </div>

          <div>
            <Input
              {...register("studentId")}
              placeholder="Student ID"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("studentId") && <p className="text-xs text-red-500">{getError("studentId")}</p>}
          </div>

          <div>
            <Input
              {...register("email")}
              placeholder="Email"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("email") && <p className="text-xs text-red-500">{getError("email")}</p>}
          </div>

          <div>
            <Input
              {...register("phoneNumber")}
              placeholder="Phone number"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("phoneNumber") && <p className="text-xs text-red-500">{getError("phoneNumber")}</p>}
          </div>

          <div>
            <Input
              type="password"
              {...register("password")}
              placeholder="Password"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("password") && <p className="text-xs text-red-500">{getError("password")}</p>}
          </div>

          <div>
            <Input
              type="password"
              {...register("confirmPassword")}
              placeholder="Confirm password"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("confirmPassword") && <p className="text-xs text-red-500">{getError("confirmPassword")}</p>}
          </div>

          <div>
            <select
              {...register("gender", { valueAsNumber: true })}
              className="border-0 border-b border-gray-200 rounded-none bg-transparent px-0 text-sm text-slate-700 py-2"
            >
              <option value={1}>Male</option>
              <option value={2}>Female</option>
              <option value={3}>Other</option>
            </select>
            {getError("gender") && <p className="text-xs text-red-500">{getError("gender")}</p>}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Birthday
            </p>
            <Input
              type="date"
              {...register("dateOfBirth")}
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-sm placeholder:text-gray-400 py-2"
            />
            {getError("dateOfBirth") && <p className="text-xs text-red-500">{getError("dateOfBirth")}</p>}
          </div>

          <div className="md:col-span-2">
            <Input
              {...register("majorOrClass")}
              placeholder="Major / Class"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-0 shadow-none text-base placeholder:text-gray-400"
            />
            {getError("majorOrClass") && <p className="text-xs text-red-500">{getError("majorOrClass")}</p>}
          </div>

          <div className="md:col-span-2">
            <textarea
              {...register("address")}
              placeholder="Address"
              rows={4}
              className="w-full rounded-none border border-transparent bg-transparent px-0 py-2 text-sm text-slate-700 shadow-none placeholder:text-gray-400 focus:outline-none"
            />
            {getError("address") && <p className="text-xs text-red-500">{getError("address")}</p>}
          </div>
        </div>

        <Button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg text-base font-semibold shadow-md shadow-orange-200 transition-all"
        >
          {registerMutation.isPending ? "Creating..." : "Create Account"}
        </Button>

        <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
          <span>Already have an account?</span>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="font-semibold text-blue-400 hover:underline"
          >
            Login
          </button>
        </div>
      </form>

      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-medium">OR</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => (window.location.href = '/api/auth/google')}
          variant="outline"
          className="rounded-lg py-3 flex gap-2 border-gray-200 hover:bg-gray-50"
        >
          <Image
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width={16}
            height={16}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold">Sign up with Google</span>
        </Button>
        <Button variant="outline" className="rounded-lg py-3 flex gap-2 border-gray-200 hover:bg-gray-50">
          <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center text-[10px] text-white font-bold">M</div>
          <span className="text-sm font-semibold">Sign up with Email</span>
        </Button>
      </div>
    </div>
  );
};

// Field helper removed: register form uses inline inputs styled like LoginForm