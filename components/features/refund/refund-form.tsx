"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { refundService } from "@/services/refund.service";
import type { RefundPolicy } from "@/types/refund.types";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ShoppingBag,
  UtensilsCrossed,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";

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

export default function RefundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

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
    refundService
      .getPolicies()
      .then(setApiPolicies)
      .catch(() => {})
      .finally(() => setPoliciesLoading(false));
  }, []);

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
    URL.revokeObjectURL(previews[idx]);
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
      toast.success("Gửi yêu cầu hoàn tiền thành công");
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

  useEffect(() => {
    if (!submitted) return;
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#D35400", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [submitted]);

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#FDFBF9] flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-[2rem] p-12 text-center shadow-lg border border-gray-50">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Yêu cầu đã được gửi</h1>
            <p className="text-gray-400 text-base mb-10 leading-relaxed">
              Yêu cầu hoàn tiền của bạn đang chờ quản lý xử lý.
              <br />
              Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>
            <button
              onClick={() => router.push(ROUTES.ORDERS)}
              className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-base rounded-xl transition-all shadow-[0_4px_16px_rgba(211,84,0,0.3)]"
            >
              Quay lại đơn hàng
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-10 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>

          <div className="bg-white rounded-[2rem] p-10 shadow-lg border border-gray-50">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-[#D35400]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Yêu cầu hoàn tiền</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Mã đơn:{" "}
                  <span className="font-mono font-bold text-gray-500">
                    {orderId.slice(0, 16)}...
                  </span>
                </p>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-base font-bold text-gray-700 block mb-4">
                Lý do hoàn tiền <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {policiesLoading ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D35400]" />
                    <span className="ml-3 text-gray-400">Đang tải lý do hoàn tiền...</span>
                  </div>
                ) : (
                  policies.map((policy) => {
                    const Icon = POLICY_ICONS[policy.code] || AlertTriangle;
                    const selected = policyCode === policy.code;
                    return (
                      <label
                        key={policy.code}
                        className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          selected
                            ? "border-[#D35400] bg-orange-50 shadow-[0_2px_12px_rgba(211,84,0,0.1)]"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="policyCode"
                          value={policy.code}
                          checked={selected}
                          onChange={(e) => setPolicyCode(e.target.value)}
                          className="mt-1 accent-[#D35400] w-5 h-5 shrink-0"
                        />
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              selected ? "bg-[#D35400] text-white" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-base font-bold text-gray-800">
                              {policy.label}
                            </span>
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                              {policy.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-base font-bold text-gray-700 block mb-3">
                Mô tả chi tiết <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả vấn đề bạn gặp phải..."
                rows={5}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] resize-none placeholder:text-gray-300"
              />
              <p className="text-xs text-gray-400 mt-2">
                {description.length} ký tự (tối thiểu 10 ký tự)
              </p>
            </div>

            <div className="mb-10">
              <label className="text-base font-bold text-gray-700 block mb-3">
                Hình ảnh minh chứng
                <span className="font-normal text-gray-400 ml-2">(tối đa 5 ảnh)</span>
              </label>
              <div className="flex flex-wrap gap-4">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group"
                  >
                    <Image src={src} alt={`Minh chứng ${idx + 1}`} fill className="object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {idx + 1}
                    </span>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#D35400] hover:text-[#D35400] hover:bg-orange-50/50 transition-all"
                  >
                    <Upload className="w-7 h-7" />
                    <span className="text-xs font-bold">Tải ảnh</span>
                    <span className="text-[10px] text-gray-300">{images.length}/5</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-5 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-base rounded-2xl transition-all shadow-[0_6px_20px_rgba(211,84,0,0.35)] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" /> Gửi yêu cầu hoàn tiền
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
