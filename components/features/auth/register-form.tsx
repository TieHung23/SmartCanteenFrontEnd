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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterBodyType & { category?: number }>({
    resolver: zodResolver(RegisterSchema) as never,
  });

  const getError = (key: string) => {
    const fieldError = (errors as Record<string, { message?: string } | undefined>)[key];
    return fieldError?.message;
  };

  const registerMutation = useMutation({
    mutationFn: (data: RegisterBodyType) => authService.register(data),
    onSuccess: (data) => {
      toast.success(
        data.message ||
          "Registration successful. Please check your email and verify your account before signing in.",
      );
      router.push(ROUTES.LOGIN);
    },
    onError: (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
      const serverMsg = error.response?.data?.message;
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        const msgs = Object.entries(serverErrors).map(([field, errs]) =>
          errs.map((e) => `${field}: ${e}`).join("\n"),
        );
        toast.error(msgs.join("\n"));
      } else {
        toast.error(serverMsg || "Registration failed. Please check all fields.");
      }
    },
  });

  const onSubmit = (data: RegisterBodyType) => {
    if (!data.name || data.name.trim() === "") {
      toast.error("Please enter your Full Name.");
      return;
    }

    if (!data.studentId || data.studentId.trim() === "") {
      toast.error("Please enter your Student ID.");
      return;
    }

    if (!data.phoneNumber || data.phoneNumber.trim() === "") {
      toast.error("Please enter your Phone Number.");
      return;
    }

    if (!data.dateOfBirth || data.dateOfBirth.trim() === "") {
      toast.error("Please select your Birthday.");
      return;
    }

    if (!data.majorOrClass || data.majorOrClass.trim() === "") {
      toast.error("Please enter your Major / Class.");
      return;
    }

    if (!data.address || data.address.trim() === "") {
      toast.error("Please enter your Address.");
      return;
    }

    const formattedDate = data.dateOfBirth.split("T")[0];

    const sanitizedData = {
      ...data,
      studentId: data.studentId.trim(),
      majorOrClass: data.majorOrClass.trim(),
      phoneNumber: data.phoneNumber.trim(),
      address: data.address.trim(),
      dateOfBirth: formattedDate,
    };

    registerMutation.mutate(sanitizedData);
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="hidden" defaultValue={1} {...register("category", { valueAsNumber: true })} />

        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-bold text-red-600 mb-1">Vui long sua cac loi sau:</p>
            <ul className="list-disc list-inside text-[11px] text-red-500 space-y-0.5">
              {Object.entries(errors).map(([key, err]) => (
                <li key={key}>
                  {key}: {(err as { message?: string })?.message || "Invalid"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              {...register("name")}
              placeholder="Name"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("name") && <p className="text-xs text-red-500">{getError("name")}</p>}
          </div>

          <div>
            <Input
              {...register("studentId")}
              placeholder="Student ID"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("studentId") && (
              <p className="text-xs text-red-500">{getError("studentId")}</p>
            )}
          </div>

          <div>
            <Input
              {...register("email")}
              placeholder="Email"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("email") && <p className="text-xs text-red-500">{getError("email")}</p>}
          </div>

          <div>
            <Input
              {...register("phoneNumber")}
              placeholder="Phone number"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("phoneNumber") && (
              <p className="text-xs text-red-500">{getError("phoneNumber")}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              {...register("password")}
              placeholder="Password"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("password") && <p className="text-xs text-red-500">{getError("password")}</p>}
          </div>

          <div>
            <Input
              type="password"
              {...register("confirmPassword")}
              placeholder="Confirm password"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("confirmPassword") && (
              <p className="text-xs text-red-500">{getError("confirmPassword")}</p>
            )}
          </div>

          <div>
            <select
              {...register("gender", { valueAsNumber: true })}
              className="w-full border-0 border-b border-gray-200 rounded-none bg-transparent px-2 text-base text-slate-700 py-2.5 focus:outline-none focus:border-orange-500"
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
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("dateOfBirth") && (
              <p className="text-xs text-red-500">{getError("dateOfBirth")}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Input
              {...register("majorOrClass")}
              placeholder="Major / Class"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("majorOrClass") && (
              <p className="text-xs text-red-500">{getError("majorOrClass")}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Input
              {...register("address")}
              placeholder="Address"
              className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base placeholder:text-gray-400 py-2.5"
            />
            {getError("address") && <p className="text-xs text-red-500">{getError("address")}</p>}
          </div>

          <div className="md:col-span-2 pt-1">
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-12 rounded-xl bg-orange-500 text-white text-base font-semibold shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
            >
              {registerMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-sm text-slate-500 pt-1">
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
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400 font-medium">OR</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          onClick={() => (window.location.href = "/api/auth/google")}
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
