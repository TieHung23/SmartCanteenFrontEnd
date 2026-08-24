"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { refundService } from "@/services/refund.service";
import type { RefundPolicy } from "@/types/refund.types";
import { toast } from "sonner";
import {
  X,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  UtensilsCrossed,
  ThumbsDown,
  MessageSquare,
  Undo2,
  ImagePlus,
  Trash2,
} from "lucide-react";

const FALLBACK_POLICIES: { code: string; label: string; description: string }[] = [
  {
    code: "cancel_order",
    label: "Đổi ý / Đặt nhầm đơn",
    description: "Muốn hủy đơn mới đặt trước giờ chốt phiên ăn",
  },
  { code: "wrong_item", label: "Sai món", description: "Món nhận không đúng với món đã đặt" },
  { code: "missing_item", label: "Thiếu món", description: "Đơn hàng thiếu món so với đã đặt" },
  { code: "other", label: "Lý do khác", description: "Vui lòng mô tả chi tiết lý do muốn hủy" },
];

const POLICY_ICONS: Record<string, typeof AlertTriangle> = {
  cancel_order: Undo2,
  wrong_item: ShoppingBag,
  missing_item: UtensilsCrossed,
  quality_issue: ThumbsDown,
  other: MessageSquare,
};

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalPrice: number;
  onSuccess: () => void;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  totalPrice,
  onSuccess,
}: CancelOrderModalProps) {
  const [policyCode, setPolicyCode] = useState("cancel_order");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiPolicies, setApiPolicies] = useState<RefundPolicy[] | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    refundService
      .getPolicies()
      .then((policies) => {
        setApiPolicies(policies);
        if (policies && policies.length > 0) {
          setPolicyCode(policies[0].code);
        }
      })
      .catch(() => {})
      .finally(() => setPoliciesLoading(false));
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

  if (!isOpen) return null;

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
    if (!policyCode) {
      toast.error("Vui lòng chọn lý do hủy đơn");
      return;
    }
    const finalDesc = description.trim() || "Yêu cầu hủy đơn hàng mới đặt trước giờ chốt phiên.";

    setIsSubmitting(true);
    try {
      await refundService.createRefund({
        orderId,
        policyCode,
        description: finalDesc,
        images,
      });
      toast.success("Đã nộp yêu cầu hủy & hoàn điểm đơn hàng!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        "Gửi yêu cầu hủy đơn thất bại. Vui lòng thử lại sau.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D35400] text-white flex items-center justify-center shadow-sm">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Yêu cầu hủy & hoàn điểm</h3>
              <p className="text-xs text-gray-500 font-medium">Đơn hàng #{orderId.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Total Amount Refund Notice */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Số tiền sẽ được hoàn trả
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tiền sẽ được cộng trực tiếp vào ví sau khi quản lý duyệt.
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#D35400] flex items-center gap-1 justify-end">
                <span>{new Intl.NumberFormat("vi-VN").format(totalPrice)}</span>
                <Image
                  src="/logo_point.png"
                  alt="coin"
                  width={18}
                  height={18}
                  className="object-contain"
                />
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
              Lý do hủy đơn <span className="text-red-500">*</span>
            </label>
            {policiesLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-[#D35400]" />
                Đang tải danh sách lý do...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {policies.map((p) => {
                  const Icon = POLICY_ICONS[p.code] || AlertTriangle;
                  const isSelected = policyCode === p.code;
                  return (
                    <div
                      key={p.code}
                      onClick={() => setPolicyCode(p.code)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-[#D35400] bg-orange-50/50 shadow-2xs"
                          : "border-gray-100 hover:border-gray-200 bg-gray-50/40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "bg-[#D35400] text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-extrabold ${
                            isSelected ? "text-[#D35400]" : "text-gray-800"
                          }`}
                        >
                          {p.label}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Note */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
              Ghi chú thêm (Không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập ghi chú thêm cho quản lý (ví dụ: Đặt nhầm suất ăn, muốn hủy để đặt ca khác)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] resize-none placeholder:text-gray-300 text-gray-800"
            />
          </div>

          {/* Optional Images */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
              Ảnh minh chứng <span className="text-gray-400 font-normal">(nếu có)</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-2xs group"
                >
                  <Image src={src} alt="Minh chứng" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#D35400] flex flex-col items-center justify-center text-gray-400 hover:text-[#D35400] cursor-pointer transition-colors bg-gray-50/50">
                  <ImagePlus className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#D35400] hover:bg-[#b04600] text-white text-xs font-bold rounded-full transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>Xác nhận gửi yêu cầu</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
