"use client";

import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ROUTES } from "@/config/routes";
import { authService } from "@/services/auth.service";
import { RegisterBodyType, RegisterSchema, UserCategory } from "@/types/auth.types";
import { PasswordInput } from "@/components/ui/password-input";
import {
  GraduationCap,
  UserCheck,
  User,
  CreditCard,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Calendar,
  BookOpen,
  MapPin,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const RegisterForm = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterSchema) as never,
    defaultValues: {
      category: UserCategory.Student,
      gender: 1,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCategory = watch("category", UserCategory.Student);
  const isStudent = Number(selectedCategory) === UserCategory.Student;

  const handleSelectRole = (role: UserCategory) => {
    setValue("category", role);
  };

  const getError = (key: string) => {
    const fieldError = (errors as Record<string, { message?: string } | undefined>)[key];
    return fieldError?.message;
  };

  const registerMutation = useMutation({
    mutationFn: (data: RegisterBodyType) => authService.register(data),
    onSuccess: (data, variables) => {
      const requiresVerification = data.value?.requiresEmailVerification ?? isStudent;
      if (requiresVerification) {
        toast.success(
          data.message || "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
        );
        router.push(`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(variables.email)}`);
      } else {
        toast.success(data.message || "Đăng ký thành công. Bạn có thể đăng nhập ngay.");
        router.push(ROUTES.LOGIN);
      }
    },
    onError: (
      error: AxiosError<{
        message?: string;
        errorCode?: string;
        errors?: Record<string, string[]>;
      }>,
    ) => {
      const serverData = error.response?.data;
      const serverMsg = serverData?.message;
      const serverErrors = serverData?.errors;

      if (serverErrors) {
        const msgs = Object.entries(serverErrors).map(([field, errs]) =>
          errs.map((e) => `${field}: ${e}`).join("\n"),
        );
        toast.error(msgs.join("\n"));
      } else if (serverData?.errorCode === "UnsupportedUserCategory") {
        toast.error(serverMsg || "Loại tài khoản này không hỗ trợ đăng ký tự do.");
      } else {
        toast.error(serverMsg || "Đăng ký thất bại. Vui lòng kiểm tra lại tất cả các trường.");
      }
    },
  });

  const onSubmit = (data: RegisterBodyType) => {
    if (!data.name || data.name.trim() === "") {
      toast.error("Vui lòng nhập Họ và tên.");
      return;
    }

    if (isStudent && (!data.studentId || data.studentId.trim() === "")) {
      toast.error("Vui lòng nhập Mã số sinh viên.");
      return;
    }

    if (!data.phoneNumber || data.phoneNumber.trim() === "") {
      toast.error("Vui lòng nhập Số điện thoại.");
      return;
    }

    if (!data.dateOfBirth || data.dateOfBirth.trim() === "") {
      toast.error("Vui lòng chọn Ngày sinh.");
      return;
    }

    if (isStudent && (!data.majorOrClass || data.majorOrClass.trim() === "")) {
      toast.error("Vui lòng nhập Chuyên ngành / Lớp.");
      return;
    }

    if (!data.address || data.address.trim() === "") {
      toast.error("Vui lòng nhập Địa chỉ.");
      return;
    }

    const formattedDate = data.dateOfBirth.split("T")[0];

    const sanitizedData: RegisterBodyType = {
      ...data,
      category: Number(data.category) || UserCategory.Student,
      studentId: isStudent && data.studentId ? data.studentId.trim() : "",
      majorOrClass: data.majorOrClass ? data.majorOrClass.trim() : "",
      phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : "",
      address: data.address ? data.address.trim() : "",
      dateOfBirth: formattedDate,
    };

    registerMutation.mutate(sanitizedData);
  };

  return (
    <div className="w-full space-y-4">
      {/* Segmented Switcher chọn vai trò ở đầu form */}
      <div className="p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/60 flex items-center gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => handleSelectRole(UserCategory.Student)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            isStudent
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Sinh viên</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectRole(UserCategory.Lecturer)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            !isStudent
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Giảng viên</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Họ và tên */}
          <div className={isStudent ? "" : "md:col-span-2"}>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                {...register("name")}
                placeholder="Họ và tên *"
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
            {getError("name") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("name")}
              </p>
            )}
          </div>

          {/* Mã số sinh viên */}
          {isStudent && (
            <div>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  {...register("studentId")}
                  placeholder="Mã SV * (ví dụ: SE170001)"
                  className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>
              {getError("studentId") && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {getError("studentId")}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                {...register("email")}
                placeholder="Địa chỉ Email *"
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
            {getError("email") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("email")}
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                {...register("phoneNumber")}
                placeholder="Số điện thoại *"
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
            {getError("phoneNumber") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("phoneNumber")}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <PasswordInput
                {...register("password")}
                placeholder="Mật khẩu *"
                inputClassName="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
                className="w-full"
              />
            </div>
            {getError("password") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("password")}
              </p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <PasswordInput
                {...register("confirmPassword")}
                placeholder="Xác nhận mật khẩu *"
                inputClassName="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
                className="w-full"
              />
            </div>
            {getError("confirmPassword") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("confirmPassword")}
              </p>
            )}
          </div>

          {/* Giới tính */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                {...register("gender", { valueAsNumber: true })}
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 font-medium cursor-pointer"
              >
                <option value={1}>Giới tính: Nam</option>
                <option value={2}>Giới tính: Nữ</option>
                <option value={3}>Giới tính: Khác</option>
              </select>
            </div>
          </div>

          {/* Ngày sinh */}
          <div>
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 font-medium"
              />
            </div>
            {getError("dateOfBirth") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("dateOfBirth")}
              </p>
            )}
          </div>

          {/* Chuyên ngành / Lớp */}
          <div className="md:col-span-2">
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                {...register("majorOrClass")}
                placeholder={
                  isStudent
                    ? "Chuyên ngành / Lớp * (ví dụ: SE1701)"
                    : "Chuyên ngành / Lớp (không bắt buộc với Giảng viên)"
                }
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
            {getError("majorOrClass") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("majorOrClass")}
              </p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="md:col-span-2">
            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200/90 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all duration-200 px-3.5 py-1">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                {...register("address")}
                placeholder="Địa chỉ liên hệ *"
                className="w-full bg-transparent border-none outline-none px-2.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
              />
            </div>
            {getError("address") && (
              <p className="flex items-center gap-1 text-xs text-red-500 mt-1 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {getError("address")}
              </p>
            )}
          </div>

          {/* Nút Tạo Tài Khoản */}
          <div className="md:col-span-2 pt-1">
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-sm sm:text-base font-bold shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {registerMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <span>Tạo tài khoản ngay</span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-500 pt-1">
          <span>Đã có tài khoản Canteen?</span>
          <button
            type="button"
            onClick={() => router.push(ROUTES.LOGIN)}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </form>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">HOẶC</span>
        </div>
      </div>

      <div>
        <Button
          type="button"
          onClick={() => (window.location.href = "/api/auth/google")}
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
