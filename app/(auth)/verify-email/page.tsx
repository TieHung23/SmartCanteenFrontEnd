"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { CheckCircle2, XCircle, Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [token, setToken] = useState(urlToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    urlToken ? "loading" : "idle",
  );
  const [message, setMessage] = useState("");

  const verify = async (t: string) => {
    setStatus("loading");
    try {
      const res = (await authService.verifyEmail(t)) as { message?: string };
      setStatus("success");
      setMessage(res?.message || "Email verified successfully!");
    } catch (error: unknown) {
      setStatus("error");
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Email verification failed. The link may be expired or invalid.";
      setMessage(msg);
    }
  };

  useEffect(() => {
    if (!urlToken) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verify(urlToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Please enter the verification token");
      return;
    }
    verify(token.trim());
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
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] text-center block"
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
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => {
                  setStatus("idle");
                  setToken("");
                }}
                className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)]"
              >
                Try Again
              </button>
              <Link
                href="/login"
                className="w-full py-4 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all text-center block"
              >
                Back to Login
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
              <h1 className="text-2xl font-extrabold text-gray-800">Verify Email</h1>
              <p className="text-gray-400 text-sm mt-1">
                Enter the verification token sent to your email.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full space-y-6 text-center">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Verification Token
                </label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your verification token"
                  className="border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-orange-500 px-2 shadow-none text-base text-center bg-transparent"
                />
              </div>
              <Button
                type="submit"
                className="w-full py-6 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl shadow-[0_4px_14px_rgba(211,84,0,0.3)] animate-none"
              >
                Verify Email
              </Button>
            </form>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
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
