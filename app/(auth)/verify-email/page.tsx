"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { CheckCircle2, XCircle, Loader2, Mail, ShieldCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const noToken = !token;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    noToken ? "error" : "loading",
  );
  const [message, setMessage] = useState(
    noToken ? "Invalid verification link. No token provided." : "",
  );

  useEffect(() => {
    if (noToken) return;

    const verifyEmail = async () => {
      try {
        const response = (await apiClient.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
          params: { token },
        })) as { value?: { message?: string }; message?: string };
        setStatus("success");
        setMessage(
          (response as { value?: { message?: string } }).value?.message ||
            "Email verified successfully!",
        );
      } catch {
        setStatus("error");
        setMessage("Email verification failed. The link may be expired or invalid.");
      }
    };

    verifyEmail();
  }, [token, noToken]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative orange elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-100/60 to-transparent pointer-events-none" />
      <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-200/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-orange-300/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-orange-100/50 p-10 text-center relative z-10">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100">
              <Mail className="w-10 h-10 text-[#D35400] animate-pulse" />
            </div>
            <Loader2 className="w-8 h-8 text-[#D35400] animate-spin" />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Verifying Email</h1>
              <p className="text-gray-400 text-sm mt-1">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100 shadow-inner">
              <ShieldCheck className="w-14 h-14 text-[#D35400]" />
            </div>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center -mt-10 border-4 border-white shadow-md">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Email Verified!</h1>
              <p className="text-gray-400 text-sm mt-1">{message}</p>
            </div>
            <Link
              href="/login"
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">Verification Failed</h1>
              <p className="text-gray-400 text-sm mt-1">{message}</p>
            </div>
            <Link
              href="/login"
              className="w-full py-4 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all"
            >
              Back to Login
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt="Smart Canteen"
            width={28}
            height={28}
            className="opacity-60"
          />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
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
