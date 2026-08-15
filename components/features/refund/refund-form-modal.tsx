"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { refundService } from "@/services/refund.service";
import type { RefundPolicy } from "@/types/refund.types";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  X,
  Upload,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ShoppingBag,
  UtensilsCrossed,
  ThumbsDown,
  MessageSquare,
  RotateCcw,
  Trash2,
} from "lucide-react";

const FALLBACK_POLICIES: { code: string; label: string; description: string }[] = [
  { code: "wrong_item", label: "Sai món", description: "Món nhận không đúng với món đã đặt" },
  { code: "missing_item", label: "Thiếu món", description: "Đơn hàng thiếu món so với đã đặt" },
  {
    code: "quality_issue",
    label: "Vấn đề chất lượng",
    description: "Món ăn không đảm bảo chất lượng",
  },
  { code: "other", label: "Lý do khác", description: "Vui lòng mô tả chi tiết trong phần ghi chú" },
];

const POLICY_ICONS: Record<string, typeof AlertTriangle> = {
  wrong_item: ShoppingBag,
  missing_item: UtensilsCrossed,
  quality_issue: ThumbsDown,
  other: MessageSquare,
};

interface RefundFormModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RefundFormModal({ isOpen, orderId, onClose, onSuccess }: RefundFormModalProps) {
  const [policyCode, setPolicyCode] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiPolicies, setApiPolicies] = useState<RefundPolicy[] | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    refundService
      .getPolicies()
      .then((policies) => {
        if (isMounted) setApiPolicies(policies);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setPoliciesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const policies = useMemo(() => {
    if (apiPolicies && apiPolicies.length > 0) {
      return apiPolicies.map((p) => ({
        code: p.code,
        label: p.name,
        description: p.description,
      }));
    }
    return FALLBACK_POLICIES;
  }, [apiPolicies]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    if (previews[idx]) {
      URL.revokeObjectURL(previews[idx]);
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!orderId) {
      toast.error("Thiếu mã đơn hàng");
      return;
    }
    if (!policyCode) {
      toast.error("Vui lòng chọn lý do hoàn tiền");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả chi tiết");
      return;
    }

    setIsSubmitting(true);
    try {
      await refundService.createRefund({
        orderId,
        policyCode,
        description: description.trim(),
        images,
      });
      setSubmitted(true);
      toast.success("Gửi yêu cầu hoàn tiền thành công!");

      // Confetti burst
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D35400", "#fbbf24", "#34d399"],
      });

      if (onSuccess) {
        onSuccess();
      }

      // Close modal after 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Gửi yêu cầu thất bại";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fadeIn">
      {/* Modal Card - Widen to max-w-3xl for spacious layout and large readable text */}
      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Clean White & Warm Orange Theme */}
        <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/80 text-[#D35400] flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Yêu cầu hoàn tiền
              </h2>
              <p className="text-xs sm:text-sm font-mono text-slate-400 font-semibold mt-0.5">
                Đơn hàng #{orderId.slice(0, 12)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-7">
          {submitted ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                Yêu cầu đã được gửi!
              </h3>
              <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                Yêu cầu hoàn tiền của bạn đã được tiếp nhận và đang chờ quản lý nhà hàng xử lý.
              </p>
            </div>
          ) : (
            <>
              {/* Reason Selection */}
              <div className="space-y-3.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider block">
                  1. Chọn lý do hoàn tiền <span className="text-red-500">*</span>
                </label>

                {policiesLoading ? (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {policies.map((p) => {
                      const IconComp = POLICY_ICONS[p.code] || FileText;
                      const isSelected = policyCode === p.code;
                      return (
                        <div
                          key={p.code}
                          onClick={() => setPolicyCode(p.code)}
                          className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                            isSelected
                              ? "bg-orange-50/90 border-orange-400 ring-2 ring-orange-400/20 shadow-xs"
                              : "bg-slate-50/60 border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/20"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-[#D35400] text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-500"
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm sm:text-base font-extrabold ${
                                isSelected ? "text-orange-950" : "text-slate-900"
                              }`}
                            >
                              {p.label}
                            </p>
                            {p.description && (
                              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-snug">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detail Description */}
              <div className="space-y-2.5">
                <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider block">
                  2. Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng cung cấp thêm thông tin cụ thể về sự cố hoặc lý do bạn muốn hoàn tiền..."
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 outline-none transition-all leading-relaxed font-medium"
                />
              </div>

              {/* Upload Proof Images */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    3. Hình ảnh bằng chứng (Tối đa 5 ảnh)
                  </label>
                  <span className="text-xs font-bold text-slate-400">{images.length}/5</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="grid grid-cols-5 gap-3.5">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                    >
                      <Image
                        src={src}
                        alt={`Minh chứng ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-28 rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-orange-600 gap-2 cursor-pointer"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-bold">Tải ảnh lên</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-[#D35400] hover:bg-[#b04600] text-white font-extrabold text-base sm:text-lg shadow-md shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <span>Gửi yêu cầu hoàn tiền</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
