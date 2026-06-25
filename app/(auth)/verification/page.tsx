"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { verificationService } from "@/services/verification.service";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import type { VerificationStatusType, VerificationDocumentType } from "@/types/verification.types";
import { DOCUMENT_TYPE_LABEL } from "@/types/verification.types";
import {
  Loader2,
  Upload,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
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

  const [entries, setEntries] = useState<FileEntry[]>(() => [
    {
      id: crypto.randomUUID?.() || Math.random().toString(),
      file: null,
      documentType: 1 as VerificationDocumentType,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const result = await verificationService.getMyVerification();
      if (result) {
        setStatus(result.status);
        setExistingRequestId(result.requestId);
        if (result.status === 3 || result.status === 4) {
          setRejectReason(result.rejectReason || result.rejectionReason || undefined);
        }
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || Math.random().toString(),
        file: null,
        documentType: 1 as VerificationDocumentType,
      },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateFile = (id: string, file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Each file must be less than 10MB");
      return;
    }
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, file } : e)));
  };

  const updateType = (id: string, documentType: VerificationDocumentType) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, documentType } : e)));
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.file !== null);
    if (validEntries.length === 0) {
      toast.error("Please upload at least one document");
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
      let msg = "Failed to submit verification";
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          msg = parsed.message || parsed.title || error.message;
        } catch {
          msg = error.message;
        }
      }
      toast.error(msg);
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

  const showUploadForm = status === null || status === 0 || status === 3 || status === 4;
  const cfg = status !== null ? STATUS_CONFIG[status] : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/uni.webp" alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-orange-100/50 p-8 md:p-10 relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
              status === 2 ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"
            }`}
          >
            {status === 2 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-[#D35400]" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-gray-800">Identity Verification</h1>
            <p className="text-gray-400 text-sm mt-1">
              Verify your identity to start using Smart Canteen
            </p>
          </div>
        </div>

        {status !== null && status !== 0 && cfg && (
          <div className={`mb-6 p-4 rounded-xl border ${cfg.bg}`}>
            <div className="flex items-center gap-3">
              {cfg.icon}
              <div>
                <p className={`font-bold text-sm ${cfg.color}`}>{cfg.title}</p>
                {status === 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hồ sơ đang được admin/staff xem xét. Bạn sẽ nhận thông báo khi có kết quả.
                  </p>
                )}
                {status === 2 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    You can now access all features of Smart Canteen.
                  </p>
                )}
                {status === 3 && rejectReason && (
                  <p className="text-xs text-red-500 mt-0.5">Reason: {rejectReason}</p>
                )}
                {status === 4 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your previous request has expired. Please submit again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 2 && (
          <div className="flex flex-col items-center gap-4">
            <Link
              href={ROUTES.HOME}
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] text-center"
            >
              Go to Home
            </Link>
          </div>
        )}

        {status === 1 && existingRequestId && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400 text-center">
              Request ID: {existingRequestId.slice(0, 12)}...
            </p>
          </div>
        )}

        {showUploadForm && (
          <div className="space-y-5">
            {status === null && (
              <p className="text-xs text-gray-500 text-center">
                Please upload your documents for identity verification
              </p>
            )}

            <div className="space-y-4">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Document #{idx + 1}
                    </span>
                    {entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {DOCUMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateType(entry.id, opt.value)}
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
                      File
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,.pdf";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0] || null;
                            updateFile(entry.id, file);
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
                            <span className="text-[11px] text-gray-500">Choose file</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addEntry}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:text-[#D35400] hover:border-[#D35400] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Document
            </button>

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
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
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
