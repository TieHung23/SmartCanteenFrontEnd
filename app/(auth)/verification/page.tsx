"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { verificationService } from "@/services/verification.service";
import { userService } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import type { VerificationStatusType, VerificationDocumentType } from "@/types/verification.types";
import { DOCUMENT_TYPE_LABEL } from "@/types/verification.types";
import confetti from "canvas-confetti";
import {
  Loader2,
  Upload,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Home,
  User,
  ArrowRight,
} from "lucide-react";

const DOCUMENT_OPTIONS: { value: VerificationDocumentType; label: string }[] = [
  { value: 1, label: DOCUMENT_TYPE_LABEL[1] },
  { value: 2, label: DOCUMENT_TYPE_LABEL[2] },
  { value: 3, label: DOCUMENT_TYPE_LABEL[3] },
];

const STATUS_CONFIG: Record<
  number,
  { icon: React.ReactNode; title: string; color: string; bg: string }
> = {
  0: {
    icon: <Clock className="w-10 h-10 text-amber-500" />,
    title: "Chưa nộp hồ sơ",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  1: {
    icon: <Clock className="w-10 h-10 text-amber-500" />,
    title: "Đang chờ duyệt",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  2: {
    icon: <CheckCircle2 className="w-10 h-10 text-emerald-500" />,
    title: "Đã được duyệt",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
  },
  3: {
    icon: <XCircle className="w-10 h-10 text-red-500" />,
    title: "Bị từ chối",
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
  },
  4: {
    icon: <AlertTriangle className="w-10 h-10 text-gray-500" />,
    title: "Hết hạn",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-100",
  },
};

interface FileEntry {
  id: string;
  file: File | null;
  documentType: VerificationDocumentType;
}

export default function VerificationPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatusType | null>(null);
  const [existingRequestId, setExistingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | undefined>();
  const [hasOpenRequest, setHasOpenRequest] = useState(false);

  const [entries, setEntries] = useState<FileEntry[]>(() => [
    {
      id: crypto.randomUUID?.() || Math.random().toString(),
      file: null,
      documentType: 1 as VerificationDocumentType,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fireFireworks = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#D35400", "#EC4899", "#8B5CF6"];

    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      colors,
    });

    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        particleCount: 12,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 12,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (status === 2) {
      fireFireworks();
    }
  }, [status, fireFireworks]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [profileRes, verificationRes] = await Promise.allSettled([
          userService.getProfile(),
          verificationService.getMyVerification(),
        ]);

        const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
        const result = verificationRes.status === "fulfilled" ? verificationRes.value : null;

        if (result) {
          if (profile?.status === 1 && result.status !== 1 && result.status !== 3) {
            setStatus(2);
          } else {
            setStatus(result.status);
          }
          setExistingRequestId(result.requestId);
          setHasOpenRequest(result.hasOpenRequest === true || result.status === 1);
          if (result.status === 3 || result.status === 4) {
            setRejectReason(result.rejectReason || result.rejectionReason || undefined);
          }
        } else if (profile?.status === 1) {
          setStatus(2);
        } else {
          setStatus(0);
        }
      } catch (err) {
        console.error("Failed to fetch verification status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const updateFile = (file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Dung lượng tập tin phải nhỏ hơn 10MB");
      return;
    }
    setEntries((prev) => (prev.length > 0 ? [{ ...prev[0], file }] : prev));
  };

  const updateType = (documentType: VerificationDocumentType) => {
    setEntries((prev) => (prev.length > 0 ? [{ ...prev[0], documentType }] : prev));
  };

  const translateVerificationError = (error: unknown): string => {
    if (!error) return "Gửi yêu cầu xác thực thất bại.";

    let message = "";
    let errorCode = "";

    if (error instanceof Error) {
      message = error.message || "";
      const errWithCode = error as Error & {
        errorCode?: string;
        errorData?: Record<string, unknown>;
      };
      errorCode = errWithCode.errorCode || (errWithCode.errorData?.errorCode as string) || "";
      if (!message && errWithCode.errorData?.message) {
        message = String(errWithCode.errorData.message);
      }
    } else if (typeof error === "object" && error !== null) {
      const obj = error as Record<string, unknown>;
      message = String(obj.message || "");
      errorCode = String(obj.errorCode || "");
    } else if (typeof error === "string") {
      message = error;
    }

    const msgLower = message.toLowerCase();

    if (
      errorCode === "AccountNotAwaitingIdentityVerification" ||
      errorCode === "AccountNotAwaitingVerification" ||
      msgLower.includes("not awaiting identity verification") ||
      msgLower.includes("account is not awaiting")
    ) {
      return "Tài khoản của bạn hiện không ở trạng thái chờ xác thực danh tính.";
    }

    if (
      errorCode === "PendingRequestExists" ||
      msgLower.includes("pending verification request") ||
      msgLower.includes("already have a pending")
    ) {
      return "Bạn đã có yêu cầu xác thực đang chờ duyệt. Vui lòng chờ xem xét.";
    }

    if (msgLower.includes("file must be less than") || msgLower.includes("file size")) {
      return "Dung lượng tập tin phải nhỏ hơn 10MB.";
    }

    if (msgLower.includes("please upload at least one")) {
      return "Vui lòng tải lên ít nhất một tài liệu.";
    }

    if (message && /[\u00C0-\u1EF9]/.test(message)) {
      return message;
    }

    return "Gửi yêu cầu xác thực thất bại. Vui lòng kiểm tra lại.";
  };

  const handleSubmit = async () => {
    if (hasOpenRequest) {
      toast.error("Bạn đã có yêu cầu xác thực đang chờ duyệt. Vui lòng chờ xem xét.");
      return;
    }
    const validEntries = entries.filter((e) => e.file !== null);
    if (validEntries.length === 0) {
      toast.error("Vui lòng tải lên ít nhất một tài liệu");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verificationService.submitVerification(
        validEntries.map((e) => e.file as File),
        validEntries.map((e) => e.documentType),
      );
      const refreshed = await verificationService.getMyVerification();
      let nextStatus = refreshed?.status ?? 1;
      if (nextStatus === 2 && !refreshed?.reviewedAt) {
        nextStatus = 1;
      }
      setExistingRequestId(refreshed?.requestId || result.requestId);
      setStatus(nextStatus);
      setHasOpenRequest(nextStatus === 1);
      setRejectReason(undefined);
      setEntries([
        {
          id: crypto.randomUUID?.() || Math.random().toString(),
          file: null,
          documentType: 1 as VerificationDocumentType,
        },
      ]);
      if (nextStatus === 2) {
        toast.success("Tài khoản của bạn đã được xác minh!");
      } else {
        toast.success("Đã nộp hồ sơ. Vui lòng chờ admin/staff duyệt.");
      }
    } catch (error: unknown) {
      console.error("Submit verification error:", error);
      toast.error(translateVerificationError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D35400] animate-spin" />
      </div>
    );
  }

  const showUploadForm =
    !hasOpenRequest && (status === null || status === 0 || status === 3 || status === 4);
  const cfg = status !== null ? STATUS_CONFIG[status] : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/uni.webp" alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-orange-100/60 p-8 md:p-10 relative z-10 animate-fadeIn">
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div
            className={`rounded-full flex items-center justify-center transition-all duration-500 ${
              status === 2
                ? "w-20 h-20 bg-emerald-50 border-2 border-emerald-200 shadow-xl shadow-emerald-500/15 ring-8 ring-emerald-500/10 scale-105"
                : "w-16 h-16 bg-orange-50 border-2 border-orange-100"
            }`}
          >
            {status === 2 ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-[#D35400]" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-850 tracking-tight flex items-center justify-center gap-2">
              <span>{status === 2 ? "Đã xác thực thành công!" : "Xác thực danh tính"}</span>
              {status === 2 && <Sparkles className="w-5 h-5 text-emerald-500" />}
            </h1>
            <p className="text-gray-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
              {status === 2
                ? "Tài khoản của bạn đã được xác thực danh tính. Bạn có thể tự do nạp tiền, đặt món ăn và trải nghiệm tất cả tính năng của Smart Canteen!"
                : "Xác thực danh tính của bạn để bắt đầu sử dụng Smart Canteen"}
            </p>
          </div>
        </div>

        {status !== null && status !== 0 && status !== 2 && cfg && (
          <div className={`mb-6 p-4 rounded-2xl border ${cfg.bg}`}>
            <div className="flex items-center gap-3">
              {cfg.icon}
              <div>
                <p className={`font-bold text-sm ${cfg.color}`}>{cfg.title}</p>
                {status === 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hồ sơ đang được admin/staff xem xét. Bạn sẽ nhận thông báo khi có kết quả.
                  </p>
                )}
                {status === 3 && rejectReason && (
                  <p className="text-xs text-red-500 mt-0.5">Lý do: {rejectReason}</p>
                )}
                {status === 4 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Yêu cầu trước đó của bạn đã hết hạn. Vui lòng nộp lại.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 2 && (
          <div className="space-y-3 pt-2">
            <Link
              href={ROUTES.HOME}
              className="w-full py-3.5 bg-gradient-to-r from-[#D35400] to-[#E67E22] hover:from-[#B34700] hover:to-[#D35400] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-[0.99] flex items-center justify-center gap-2 group text-center"
            >
              <Home className="w-4 h-4 text-white/90" />
              <span>Về trang chủ</span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={ROUTES.PROFILE}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 transition-all text-center flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>Quay lại trang cá nhân</span>
            </Link>
          </div>
        )}

        {status === 1 && existingRequestId && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400 text-center">
              Mã yêu cầu: {existingRequestId.slice(0, 12)}...
            </p>
          </div>
        )}

        {showUploadForm && (
          <div className="space-y-5">
            {status === null && (
              <p className="text-xs text-gray-500 text-center">
                Vui lòng tải lên tài liệu để xác thực danh tính
              </p>
            )}

            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {DOCUMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateType(opt.value)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        entry.documentType === opt.value
                          ? "border-[#D35400] bg-orange-50 text-[#D35400]"
                          : "border-gray-100 bg-white text-gray-500 hover:border-orange-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Tập tin
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*,.pdf";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0] || null;
                          updateFile(file);
                        };
                        input.click();
                      }}
                      className={`flex-1 border-2 border-dashed rounded-xl py-3 px-3 text-center cursor-pointer transition-all ${
                        entry.file
                          ? "border-[#D35400] bg-orange-50/30"
                          : "border-gray-200 hover:border-orange-300 bg-white"
                      }`}
                    >
                      {entry.file ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 text-[#D35400]" />
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                            {entry.file.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Upload className="w-4 h-4 text-gray-300" />
                          <span className="text-[11px] text-gray-500">Chọn tập tin</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || entries.every((e) => !e.file)}
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu xác thực"}
            </button>
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
