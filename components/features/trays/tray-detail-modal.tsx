"use client";

import { useEffect, useState } from "react";
import {
  Package,
  PackageCheck,
  ShieldCheck,
  PackageOpen,
  Copy,
  Check,
  RefreshCw,
  Clock,
  QrCode,
  FileText,
  AlertTriangle,
  ExternalLink,
  Unlock,
  Lock,
} from "lucide-react";
import Modal from "@/app/manager/_components/modal";
import { trayService } from "@/services/tray.service";
import type { TrayDetail, TrayStatus } from "@/types/tray.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";
import Link from "next/link";

const STATUS_CONFIG: Record<
  TrayStatus,
  {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    icon: typeof Package;
    description: string;
  }
> = {
  Available: {
    label: "Sẵn sàng",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    icon: PackageCheck,
    description: "Khay trống, sẵn sàng để gán cho đơn hàng mới.",
  },
  Reserved: {
    label: "Đang giữ đơn",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
    icon: ShieldCheck,
    description: "Khay đang được giữ cho một đơn hàng đang chuẩn bị hoặc xếp món.",
  },
  InUse: {
    label: "Đang sử dụng",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/60",
    icon: PackageOpen,
    description: "Khay đang đặt tại ô nhận hàng hoặc khách hàng đang sử dụng.",
  },
};

interface TrayDetailModalProps {
  trayId: string | null;
  initialCurrentOrderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshPool?: () => void;
}

export default function TrayDetailModal({
  trayId,
  initialCurrentOrderId,
  isOpen,
  onClose,
  onRefreshPool,
}: TrayDetailModalProps) {
  const [detail, setDetail] = useState<TrayDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await trayService.getById(id);
      setDetail(data);
    } catch (err: unknown) {
      console.error("Failed to fetch tray details:", err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError("Không tìm thấy thông tin khay. Khay có thể đã bị xóa.");
      } else {
        setError("Không thể tải thông tin chi tiết khay. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (isOpen && trayId) {
      trayService
        .getById(trayId)
        .then((data) => {
          if (active) {
            setDetail(data);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            console.error("Failed to fetch tray details:", err);
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
              setError("Không tìm thấy thông tin khay. Khay có thể đã bị xóa.");
            } else {
              setError("Không thể tải thông tin chi tiết khay. Vui lòng thử lại.");
            }
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      const timer = setTimeout(() => {
        if (active) {
          setDetail(null);
          setError(null);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    return () => {
      active = false;
    };
  }, [isOpen, trayId]);

  const handleCopy = (text: string, type: "id" | "orderId") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
    toast.success("Đã sao chép vào bộ nhớ tạm");
  };

  const handleForceRelease = async () => {
    if (!detail) return;
    const res = await Swal.fire({
      title: "Mở khay?",
      html: `Đưa khay <strong class="text-[#D35400]">${detail.code}</strong> về lại trạng thái Sẵn sàng?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Mở khay",
      cancelButtonText: "Hủy",
    });
    if (!res.isConfirmed) return;

    setActionLoading(true);
    try {
      await trayService.forceRelease(detail.id);
      toast.success(`Đã mở khay ${detail.code} thành công`);
      fetchDetail(detail.id);
      if (onRefreshPool) onRefreshPool();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetire = async () => {
    if (!detail) return;
    const res = await Swal.fire({
      title: "Khóa khay này?",
      html: `Bạn có chắc muốn tạm khóa khay <strong class="text-[#D35400]">${detail.code}</strong>? Khay sẽ không thể gán cho các đơn hàng mới.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Khóa khay",
      cancelButtonText: "Hủy",
    });
    if (!res.isConfirmed) return;

    setActionLoading(true);
    try {
      await trayService.retire(detail.id);
      toast.success(`Đã khóa khay ${detail.code}`);
      fetchDetail(detail.id);
      if (onRefreshPool) onRefreshPool();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const statusConfig = detail ? (STATUS_CONFIG[detail.status] ?? STATUS_CONFIG.Available) : null;
  const StatusIcon = statusConfig?.icon ?? Package;

  // Flexible check for current order ID across API fields or fallback prop (ignoring Guid.Empty)
  const rawOrderId =
    detail?.currentOrderId ||
    ((detail as unknown as Record<string, unknown>)?.orderId as string) ||
    ((detail as unknown as Record<string, unknown>)?.activeOrderId as string) ||
    ((detail as unknown as Record<string, unknown>)?.orderCode as string) ||
    ((detail as unknown as Record<string, unknown>)?.CurrentOrderId as string) ||
    ((detail as unknown as Record<string, unknown>)?.OrderId as string) ||
    ((detail as unknown as Record<string, unknown>)?.ActiveOrderId as string) ||
    ((detail as unknown as Record<string, unknown>)?.OrderCode as string) ||
    initialCurrentOrderId ||
    null;

  const displayOrderId =
    rawOrderId && rawOrderId !== "00000000-0000-0000-0000-000000000000" ? rawOrderId : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết khay" size="lg">
      <div className="space-y-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <Package className="w-5 h-5 text-orange-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Đang tải chi tiết khay...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200/60 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-red-700">{error}</p>
            {trayId && (
              <button
                onClick={() => fetchDetail(trayId)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại
              </button>
            )}
          </div>
        ) : detail ? (
          <>
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white px-5 py-4 shadow-md shadow-orange-500/15">
              <div className="absolute right-0 top-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-orange-100 font-semibold">
                        Mã khay
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                        Pool Tray
                      </span>
                    </div>
                    <h3 className="text-lg font-mono font-bold tracking-wider text-white">
                      {detail.code}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => trayId && fetchDetail(trayId)}
                    disabled={loading}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-all active:scale-95 shadow-2xs"
                    title="Làm mới thông tin"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  </button>

                  {statusConfig && (
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-md shadow-2xs",
                        statusConfig.bg,
                        statusConfig.text,
                        statusConfig.border,
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", statusConfig.dot)} />
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusConfig.label}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tray ID UUID */}
              <div className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-gray-500" />
                    Mã định danh (UUID)
                  </span>
                  <button
                    onClick={() => handleCopy(detail.id, "id")}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-800 break-all bg-white p-2.5 rounded-xl border border-gray-200/50">
                  {detail.id}
                </p>
              </div>

              {/* Current Order */}
              <div className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                    Đơn hàng gắn khay
                  </span>
                  {displayOrderId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(displayOrderId, "orderId")}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      >
                        {copiedOrderId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                      <Link
                        href={`/manager/orders?search=${displayOrderId}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
                {displayOrderId ? (
                  <p className="text-xs font-mono text-blue-700 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/60 break-all font-semibold">
                    {displayOrderId}
                  </p>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-gray-200 bg-white text-gray-400 text-xs italic">
                    Chưa gắn với đơn hàng nào
                  </div>
                )}
              </div>

              {/* Slot / Location info if present */}
              {(detail.slotCode || detail.slotId) && (
                <div className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Vị trí Ô Nhận Hàng (Slot)
                  </span>
                  <p className="text-sm font-mono font-bold text-gray-800">
                    {detail.slotCode ?? detail.slotId}
                  </p>
                </div>
              )}

              {/* Status Description Box */}
              <div className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-4 space-y-1.5 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Mô tả trạng thái
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">{statusConfig?.description}</p>
              </div>

              {/* Updated At */}
              <div className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-4 space-y-1.5 md:col-span-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  Cập nhật lần cuối
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {detail.updatedAtUtc
                    ? new Date(detail.updatedAtUtc).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Chưa có thông tin"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {detail.status !== "Available" && (
                  <button
                    onClick={handleForceRelease}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
                    title="Đưa khay về trạng thái Sẵn sàng"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Mở khay
                  </button>
                )}

                <button
                  onClick={handleRetire}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                  title="Tạm khóa khay này"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Khóa khay
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-xs"
              >
                Đóng
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
