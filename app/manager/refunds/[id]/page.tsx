"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Coins, Landmark, FileText, CheckCircle2, XCircle, X } from "lucide-react";
import { refundService } from "@/services/refund.service";
import type { ManagerRefundDetail } from "@/types/refund.types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: "text-yellow-850", bg: "bg-yellow-50" },
  Approved: { label: "Approved", color: "text-green-850", bg: "bg-green-50" },
  Rejected: { label: "Rejected", color: "text-red-850", bg: "bg-red-50" },
};

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ManagerRefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await refundService.managerGetDetail(id);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm("Approve this refund request? The user will be credited.")) return;
    setActionLoading(true);
    try {
      await refundService.managerApprove(id);
      router.push("/manager/refunds");
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
      await refundService.managerReject(id, rejectReason.trim());
      router.push("/manager/refunds");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải chi tiết yêu cầu hoàn tiền...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs animate-fade-in">
        ⚠️ Yêu cầu hoàn tiền không tồn tại.
      </div>
    );
  }

  const style = STATUS_STYLES[detail.status] || STATUS_STYLES.Pending;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 px-4 md:px-0">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/manager/refunds")}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Refunds
        </button>

        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Refund Detail</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Chi tiết yêu cầu hoàn tiền:{" "}
            <span className="font-mono font-bold text-gray-900">
              #{detail.id.slice(0, 8).toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Request Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <FileText className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Chi tiết yêu cầu</h2>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="py-3.5 first:pt-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã người dùng (User ID)
                </p>
                <p className="text-sm font-mono font-bold text-gray-800 mt-1">{detail.userId}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Mã đơn hàng (Order ID)
                </p>
                <p className="text-sm font-mono font-bold text-gray-800 mt-1">{detail.orderId}</p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Chính sách áp dụng
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {detail.policyName}{" "}
                  <span className="font-mono font-semibold text-gray-400 text-xs">
                    ({detail.policyCode})
                  </span>
                </p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Lý do từ người dùng
                </p>
                <p className="text-sm text-gray-750 bg-gray-50 border border-gray-100 p-4 rounded-2xl mt-2 italic leading-relaxed">
                  &ldquo;{detail.description || "Không có mô tả chi tiết."}&rdquo;
                </p>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trạng thái xử lý
                </p>
                <span
                  className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    detail.status === "Pending"
                      ? "bg-yellow-105 text-yellow-800 border border-yellow-200/60"
                      : detail.status === "Approved"
                        ? "bg-green-105 text-green-800 border border-green-200/60"
                        : "bg-red-105 text-red-800 border border-red-200/60",
                  )}
                >
                  {style.label}
                </span>
              </div>
              <div className="py-3.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ngày tạo yêu cầu
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-1">
                  {new Date(detail.createdAtUtc).toLocaleString("vi-VN")}
                </p>
              </div>
              {detail.reviewedAtUtc && (
                <div className="py-3.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ngày phê duyệt
                  </p>
                  <p className="text-sm font-semibold text-gray-600 mt-1">
                    {new Date(detail.reviewedAtUtc).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
              {detail.rejectionReason && (
                <div className="py-3.5 pt-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Lý do từ chối hoàn tiền
                  </p>
                  <p className="text-sm text-red-650 mt-1 italic">
                    &ldquo;{detail.rejectionReason}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Financial info & Evidence Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
              <Coins className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-lg font-bold text-gray-900">Tài chính</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-500">Giá trị đơn gốc:</span>
                <span className="inline-flex items-center gap-1 font-bold text-gray-900">
                  {new Intl.NumberFormat("vi-VN").format(detail.orderAmount)}
                  <div className="relative w-4 h-4 opacity-95">
                    <Image
                      src="/logo_point.png"
                      alt="Watermark Logo"
                      fill
                      sizes="20px"
                      className="object-contain filter brightness-110"
                    />
                  </div>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-500">Tỷ lệ hoàn tiền:</span>
                <span className="text-base font-bold text-gray-700 bg-orange-50 px-2 py-0.5 border border-orange-100/50 rounded-lg text-xs">
                  {detail.refundPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-500">Thực nhận hoàn trả:</span>
                <span className="inline-flex items-center gap-1 text-xl font-bold text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(detail.refundAmount)}
                  <div className="relative w-5 h-5 opacity-95">
                    <Image
                      src="/logo_point.png"
                      alt="Watermark Logo"
                      fill
                      sizes="20px"
                      className="object-contain filter brightness-110"
                    />
                  </div>
                </span>
              </div>
              {detail.walletTransactionId && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Landmark className="w-3.5 h-3.5" /> Mã giao dịch ví
                  </p>
                  <p className="text-xs font-mono text-gray-700 bg-gray-50 border border-gray-150 p-2 rounded-lg truncate">
                    {detail.walletTransactionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Images */}
          {detail.images.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-200/60 p-6 space-y-4 shadow-2xs">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  Hình ảnh minh chứng ({detail.images.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {detail.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActivePhoto(img.imageUrl)}
                    className="block group cursor-zoom-in"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-150/60 group-hover:border-orange-200 transition-all duration-300 image-3d">
                      <Image
                        src={img.imageUrl}
                        alt={img.fileName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="180px"
                      />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 mt-2 truncate group-hover:text-gray-700 transition-colors">
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
        <div className="bg-white rounded-3xl border border-gray-200/60 p-8 space-y-6 shadow-2xs">
          <div className="border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-gray-900">Thao tác duyệt hoàn tiền</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="w-5 h-5" />
              {actionLoading ? "Đang xử lý..." : "Duyệt & Hoàn tiền"}
            </button>
            <button
              onClick={() => setShowReject(!showReject)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60"
            >
              <XCircle className="w-5 h-5" />
              Từ chối hoàn tiền
            </button>
          </div>

          {showReject && (
            <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 animate-slide-down">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Lý do từ chối hoàn tiền *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết từ chối yêu cầu hoàn tiền..."
                  rows={4}
                  className="w-full px-4 py-3 text-base bg-white border border-gray-250/60 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder:text-gray-400 transition-all resize-none animate-fade-in"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60 shadow-xs"
                >
                  Xác nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in backdrop-blur-sm"
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/10"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
