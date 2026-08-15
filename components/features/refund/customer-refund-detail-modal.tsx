"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Wallet,
  ExternalLink,
  Utensils,
  Image as ImageIcon,
  AlertTriangle,
  ZoomIn,
} from "lucide-react";
import { refundService } from "@/services/refund.service";
import {
  normalizeRefundStatus,
  REFUND_STATUS_META,
  type CustomerRefundDetail,
  type RefundImage,
} from "@/types/refund.types";
import { formatCurrency } from "@/lib/utils";

interface CustomerRefundDetailModalProps {
  refundId: string | null;
  onClose: () => void;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CustomerRefundDetailModal({ refundId, onClose }: CustomerRefundDetailModalProps) {
  const [detail, setDetail] = useState<CustomerRefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!refundId) return;

    let isMounted = true;
    refundService
      .getRefundDetail(refundId)
      .then((data) => {
        if (isMounted) {
          setDetail(data as unknown as CustomerRefundDetail);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || "Không thể tải chi tiết yêu cầu hoàn tiền");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refundId]);

  if (!refundId) return null;

  const statusNum = detail ? normalizeRefundStatus(detail.status) : 1;
  const statusMeta = REFUND_STATUS_META[statusNum] || REFUND_STATUS_META[1];

  const getImageUrl = (img: RefundImage | string): string => {
    if (typeof img === "string") return img;
    return img.imageUrl || "";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      {/* Modal Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-white">
                Chi tiết yêu cầu hoàn tiền
              </h2>
              {detail && (
                <p className="text-xs font-mono text-orange-100/90">Mã: #{detail.id.slice(0, 8)}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-xs font-semibold">Đang tải thông tin hoàn tiền...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">{error}</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Status Banner */}
              <div
                className="p-4 rounded-2xl flex items-center justify-between border shadow-2xs"
                style={{
                  backgroundColor: statusMeta.bg,
                  borderColor: `${statusMeta.color}40`,
                }}
              >
                <div className="flex items-center gap-3">
                  {statusNum === 2 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : statusNum === 3 ? (
                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                  ) : (
                    <Clock className="w-6 h-6 text-orange-600 shrink-0" />
                  )}
                  <div>
                    <span
                      className="text-xs font-extrabold uppercase tracking-wider block"
                      style={{ color: statusMeta.color }}
                    >
                      {statusMeta.label}
                    </span>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      {statusNum === 2
                        ? "Yêu cầu đã được phê duyệt và tiền đã nạp vào ví."
                        : statusNum === 3
                          ? "Yêu cầu hoàn tiền bị từ chối bởi nhà hàng."
                          : "Yêu cầu của bạn đang được nhân viên kiểm tra."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Reference */}
              <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-orange-600 shadow-2xs">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Đơn hàng liên quan
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-800">
                      #{detail.orderId.slice(0, 12)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/orders/${detail.orderId}`}
                  className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span>Xem đơn hàng</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Policy & Note */}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Lý do hoàn tiền
                  </p>
                  <div className="bg-orange-50/80 border border-orange-200/80 p-3.5 rounded-2xl text-xs font-bold text-orange-950">
                    {detail.policyName || detail.policyCode || "Không có chính sách"}
                  </div>
                </div>

                {detail.description && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Ghi chú từ bạn
                    </p>
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed">
                      {detail.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Dish Details (if available) */}
              {(detail.dishName || detail.currentDishName) && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Món ăn liên quan
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <span>{detail.currentDishName || detail.dishName}</span>
                  </div>
                  {detail.suggestedDishName && (
                    <p className="text-xs text-slate-500 font-medium pl-6">
                      Món gợi ý thay thế:{" "}
                      <span className="font-bold text-slate-700">{detail.suggestedDishName}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/50 to-orange-50/90 border border-orange-200/80 p-5 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Giá trị món / đơn hàng:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(detail.orderAmount || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Tỷ lệ hoàn lại:</span>
                  <span className="font-bold text-slate-800">{detail.refundPercent ?? 100}%</span>
                </div>
                <div className="border-t border-orange-200/60 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Wallet className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Số tiền hoàn vào ví:</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">
                    +{formatCurrency(detail.refundAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Rejection Reason (If Rejected) */}
              {statusNum === 3 && detail.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Lý do nhà hàng từ chối:</span>
                  </div>
                  <p className="text-red-900 font-medium leading-relaxed pl-5">
                    {detail.rejectionReason}
                  </p>
                </div>
              )}

              {/* Attached Proof Images */}
              {detail.images && detail.images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    <span>Hình ảnh bằng chứng ({detail.images.length})</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {detail.images.map((img, idx) => {
                      const url = getImageUrl(img);
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedImage(url)}
                          className="relative h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100"
                        >
                          <Image
                            src={url}
                            alt={`Bằng chứng ${idx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dates Footer */}
              <div className="pt-3 text-[11px] text-slate-400 space-y-1 border-t border-slate-100 font-medium">
                <p>Thời gian gửi yêu cầu: {formatDate(detail.createdAtUtc)}</p>
                {detail.reviewedAtUtc && <p>Thời gian xử lý: {formatDate(detail.reviewedAtUtc)}</p>}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl h-[70vh]">
            <Image src={selectedImage} alt="Bằng chứng full" fill className="object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
