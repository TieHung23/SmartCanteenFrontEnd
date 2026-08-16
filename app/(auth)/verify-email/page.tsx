"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { XCircle, Loader2, Mail, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { toast } from "sonner";

function formatCooldownTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email") || "";
  const urlCode = searchParams.get("code") || "";

  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlCode);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    urlEmail && urlCode ? "loading" : "idle",
  );
  const [message, setMessage] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verify = async (e: string, c: string) => {
    setStatus("loading");
    try {
      const res = (await authService.verifyEmail(e, c)) as { message?: string };
      setStatus("success");
      setMessage(res?.message || "Xác thực email thành công!");
    } catch (error: unknown) {
      setStatus("error");
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Xác thực email thất bại. Mã OTP có thể đã hết hạn hoặc không đúng.";
      setMessage(msg);
    }
  };

  const handleResendCode = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast.error("Vui lòng nhập địa chỉ email");
      return;
    }
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const res = await authService.resendVerificationEmail(targetEmail);
      const normalizedEmail = res?.value?.email || targetEmail;
      setEmail(normalizedEmail);
      toast.success(res?.message || `Mã xác thực mới đã được gửi tới email ${normalizedEmail}`);
      setResendCooldown(300); // 5 minutes cooldown matching Jwt:EmailVerificationCodeMinutes
      if (status === "error") {
        setStatus("idle");
        setCode("");
      }
    } catch (error: unknown) {
      const errorData = (
        error as { response?: { data?: { errorCode?: string; message?: string } } }
      )?.response?.data;
      const errorCode = errorData?.errorCode;
      const serverMsg = errorData?.message;

      if (errorCode === "VerificationCodeStillValid") {
        toast.info(
          serverMsg ||
            "Mã xác thực trước đó vẫn còn hiệu lực (5 phút). Vui lòng kiểm tra hộp thư email của bạn.",
          {
            description: "Bạn có thể sử dụng mã đã nhận trước đó hoặc đợi mã hết hạn để gửi lại.",
            duration: 6000,
          },
        );
        setResendCooldown(180);
        if (status === "error") {
          setStatus("idle");
        }
      } else if (errorCode === "EmailAlreadyVerified") {
        toast.success(serverMsg || "Email này đã được xác thực. Bạn có thể đăng nhập ngay!", {
          duration: 5000,
        });
        router.push("/login");
      } else if (errorCode === "UserNotFound") {
        toast.error(serverMsg || "Không tìm thấy tài khoản nào khớp với email này.");
      } else if (errorCode === "UnsupportedUserCategory") {
        toast.error(serverMsg || "Loại tài khoản này không sử dụng mã xác thực qua email.");
      } else {
        toast.error(serverMsg || "Có lỗi xảy ra khi gửi lại mã. Vui lòng thử lại sau.");
      }
    } finally {
      setIsResending(false);
    }
  };
  useEffect(() => {
    if (urlEmail && urlCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      verify(urlEmail, urlCode);
    }
  }, [urlEmail, urlCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã xác thực");
      return;
    }
    verify(email.trim(), code.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/uni2.jpg" alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/20 to-transparent pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-10 text-center relative z-10">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100">
              <Mail className="w-10 h-10 text-[#D35400] animate-pulse" />
            </div>
            <Loader2 className="w-8 h-8 text-[#D35400] animate-spin" />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Đang xác thực email</h1>
              <p className="text-gray-400 text-sm mt-1">
                Vui lòng đợi trong khi chúng tôi xác thực địa chỉ email của bạn.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100 shadow-inner">
              <ShieldCheck className="w-14 h-14 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-850">Email đã được xác thực!</h1>
              <p className="text-gray-400 text-sm mt-1 font-semibold">{message}</p>
            </div>
            <Link
              href="/login"
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] text-center block"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Xác thực thất bại</h1>
              <p className="text-gray-400 text-sm mt-1">{message}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi lại mã...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Gửi lại mã mới ({formatCooldownTime(resendCooldown)})</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Gửi lại mã OTP mới</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setCode("");
                }}
                className="w-full py-4 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all"
              >
                Thử lại
              </button>
              <Link
                href="/login"
                className="w-full py-4 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all text-center block"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100">
              <Mail className="w-10 h-10 text-[#D35400]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Xác thực email</h1>
              <p className="text-gray-400 text-sm mt-1">
                Nhập mã xác thực đã được gửi đến email của bạn.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full space-y-6 text-center">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base text-center bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-3">Mã xác thực</label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Resend OTP Link */}
              <div className="flex items-center justify-center text-xs gap-1.5 pt-1">
                <span className="text-gray-400 font-medium">Chưa nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="font-bold text-[#D35400] hover:text-[#B34700] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Gửi lại mã ({formatCooldownTime(resendCooldown)})</span>
                  ) : (
                    <span className="flex items-center gap-1 underline underline-offset-2">
                      <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP
                    </span>
                  )}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full py-6 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl shadow-[0_4px_14px_rgba(211,84,0,0.3)] animate-none"
              >
                Xác thực email
              </Button>
            </form>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt="Smart Canteen"
            width={28}
            height={28}
            className="opacity-60 rounded-full"
          />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
            Smart Canteen
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
