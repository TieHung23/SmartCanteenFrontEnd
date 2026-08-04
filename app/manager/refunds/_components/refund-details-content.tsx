"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Coins, Landmark, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import Swal from "sweetalert2";
import { refundService } from "@/services/refund.service";
import type { ManagerRefundDetail } from "@/types/refund.types";
import { cn } from "@/lib/utils";

const getRefundStatusStyle = (
  status: string | number,
  changeProposalId?: string | null,
  reviewedBy?: string | null,
) => {
  const s = String(status).toLowerCase();
  if (s === "pending" || s === "1" || s === "0") {
    return {
      label: "Chờ xử lý",
      color: "text-amber-800",
      bg: "bg-amber-100 border border-amber-200",
    };
  }
  if (s === "approved" || s === "2") {
    if (changeProposalId || reviewedBy === null) {
      return {
        label: "Tự động hoàn tiền",
        color: "text-blue-800",
        bg: "bg-blue-100 border border-blue-200",
      };
    }
    return {
      label: "Đã duyệt",
      color: "text-emerald-800",
      bg: "bg-emerald-100 border border-emerald-200",
    };
  }
  if (s === "rejected" || s === "3") {
    return { label: "Từ chối", color: "text-red-800", bg: "bg-red-100 border border-red-200" };
  }
  return {
    label: "Chờ xử lý",
    color: "text-amber-800",
    bg: "bg-amber-100 border border-amber-200",
  };
};

interface RefundDetailsContentProps {
  requestId: string;
  onSuccess: () => void;
}

export function RefundDetailsContent({ requestId, onSuccess }: RefundDetailsContentProps) {
  const [detail, setDetail] = useState<ManagerRefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await refundService.managerGetDetail(requestId);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [requestId]);

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: "Xác nhận duyệt hoàn tiền",
      text: "Người dùng sẽ được hoàn tiền vào ví. Bạn có chắc chắn muốn duyệt?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Duyệt & Hoàn tiền",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await refundService.managerApprove(requestId);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await refundService.managerReject(requestId, rejectReason.trim());
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500">Đang tải chi tiết yêu cầu hoàn tiền...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-sm font-bold shadow-xs">
        ⚠️ Yêu cầu hoàn tiền không tồn tại.
      </div>
    );
  }

  const style = getRefundStatusStyle(detail.status, detail.changeProposalId, detail.reviewedBy);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Request Info */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/30 p-5 shadow-3xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <FileText className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Chi tiết yêu cầu</h2>
            </div>

            <div className="divide-y divide-gray-100/60 text-sm">
              <div className="py-3 first:pt-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Người dùng
                </p>
                <p className="font-bold text-gray-900 mt-1">{detail.userName || "—"}</p>
                {detail.userEmail && (
                  <p className="text-xs text-gray-500 mt-0.5">{detail.userEmail}</p>
                )}
                <p className="font-mono font-bold text-gray-400 text-xs mt-0.5">{detail.userId}</p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã đơn hàng (Order ID)
                </p>
                <p className="font-mono font-bold text-gray-800 mt-1 truncate">{detail.orderId}</p>
              </div>
              {detail.changeProposalId && (
                <div className="py-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Mã đề xuất đổi món
                  </p>
                  <p className="font-mono font-bold text-[#D35400] mt-1 truncate">
                    {detail.changeProposalId}
                  </p>
                </div>
              )}
              {(detail.dishName ||
                detail.currentDishName ||
                detail.suggestedDishName ||
                detail.selectedDishName) && (
                <div className="py-3 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Món ăn liên quan
                  </p>
                  {detail.dishName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-500">Món gốc:</span>
                      <span className="font-bold text-gray-900">{detail.dishName}</span>
                    </div>
                  )}
                  {detail.currentDishName && detail.currentDishName !== detail.dishName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-500">Món thiếu:</span>
                      <span className="font-bold text-gray-900">{detail.currentDishName}</span>
                    </div>
                  )}
                  {detail.suggestedDishName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-500">Đề xuất thay thế:</span>
                      <span className="font-bold text-emerald-600">{detail.suggestedDishName}</span>
                    </div>
                  )}
                  {detail.selectedDishName && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-500">Khách chọn:</span>
                      <span className="font-bold text-blue-600">{detail.selectedDishName}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Chính sách áp dụng
                </p>
                <p className="font-bold text-gray-900 mt-1">
                  {detail.policyName}{" "}
                  <span className="font-mono font-semibold text-gray-400 text-xs">
                    ({detail.policyCode})
                  </span>
                </p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Lý do từ người dùng
                </p>
                <p className="text-gray-755 bg-gray-50 border border-gray-200/20 p-3.5 rounded-2xl mt-2 italic leading-relaxed">
                  &ldquo;{detail.description || "Không có mô tả chi tiết."}&rdquo;
                </p>
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trạng thái xử lý
                </p>
                <span
                  className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    style.bg,
                  )}
                >
                  {style.label}
                </span>
                {(detail.changeProposalId || detail.reviewedBy === null) && (
                  <p className="text-xs font-semibold text-blue-600 mt-1.5 italic">
                    ⚡ Hệ thống tự động hoàn tiền trực tiếp vào ví người dùng (do sự cố ca phục vụ).
                  </p>
                )}
              </div>
              <div className="py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ngày tạo yêu cầu
                </p>
                <p className="font-semibold text-gray-600 mt-1">
                  {new Date(detail.createdAtUtc).toLocaleString("vi-VN")}
                </p>
              </div>
              {detail.reviewedAtUtc && (
                <div className="py-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ngày phê duyệt
                  </p>
                  <p className="font-semibold text-gray-600 mt-1">
                    {new Date(detail.reviewedAtUtc).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
              {detail.rejectionReason && (
                <div className="py-3 pt-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Lý do từ chối hoàn tiền
                  </p>
                  <p className="text-red-650 mt-1 italic">&ldquo;{detail.rejectionReason}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Financial info & Evidence Images */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/30 p-5 shadow-3xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <Coins className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Tài chính</h2>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100/40">
                <span className="font-bold text-gray-500">Giá trị đơn gốc:</span>
                <span className="inline-flex items-center gap-1 font-bold text-gray-900">
                  {new Intl.NumberFormat("vi-VN").format(detail.orderAmount)}
                  <div className="relative w-4 h-4 opacity-95">
                    <Image
                      src="/logo_point.png"
                      alt="Point Logo"
                      fill
                      sizes="16px"
                      className="object-contain filter brightness-110"
                    />
                  </div>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100/40">
                <span className="font-bold text-gray-500">Tỷ lệ hoàn tiền:</span>
                <span className="text-xs font-bold text-gray-705 bg-orange-50/50 px-2 py-0.5 border border-orange-100/30 rounded-lg">
                  {detail.refundPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100/40">
                <span className="font-bold text-gray-500">Thực nhận hoàn trả:</span>
                <span className="inline-flex items-center gap-1 text-lg font-bold text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(detail.refundAmount)}
                  <div className="relative w-4.5 h-4.5 opacity-95">
                    <Image
                      src="/logo_point.png"
                      alt="Point Logo"
                      fill
                      sizes="18px"
                      className="object-contain filter brightness-110"
                    />
                  </div>
                </span>
              </div>
              {detail.walletTransactionId && (
                <div className="pt-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Landmark className="w-3.5 h-3.5" /> Mã giao dịch ví
                  </p>
                  <p className="text-xs font-mono text-gray-750 bg-gray-50/60 border border-gray-200/30 p-2 rounded-lg truncate">
                    {detail.walletTransactionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Images */}
          {detail.images.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-200/30 p-5 space-y-3.5 shadow-3xs">
              <div className="border-b border-gray-100 pb-2.5">
                <h2 className="text-base font-bold text-gray-900">
                  Hình ảnh minh chứng ({detail.images.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {detail.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActivePhoto(img.imageUrl)}
                    className="block group cursor-zoom-in text-center"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200/30 group-hover:border-orange-200/60 transition-all duration-300">
                      <Image
                        src={img.imageUrl}
                        alt={img.fileName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="120px"
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1 truncate group-hover:text-gray-700 transition-colors">
                      {img.fileName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {detail.status === "Pending" && (
        <div className="bg-white rounded-3xl border border-gray-200/30 p-6 space-y-4 shadow-3xs">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-base font-bold text-gray-900">Thao tác duyệt hoàn tiền</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-3xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading ? "Đang xử lý..." : "Duyệt & Hoàn tiền"}
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-3xs cursor-pointer active:scale-95"
            >
              <XCircle className="w-4 h-4" />
              Từ chối hoàn tiền
            </button>
          </div>

          {showReject && (
            <div className="space-y-3 pt-3 border-t border-dashed border-gray-200 animate-slide-down">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Lý do từ chối hoàn tiền *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết từ chối yêu cầu hoàn tiền..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200/35 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-3xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-3xs cursor-pointer"
                >
                  Xác nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in backdrop-blur-sm"
          >
            <div
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
