"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useOrderDetail } from "@/lib/hooks/useCanteen";
import { ORDER_STATUS_META, type OrderStatus } from "@/types/order.types";
import { orderService } from "@/services/order.service";
import { refundService } from "@/services/refund.service";
import { REFUND_STATUS_META, type RefundStatus } from "@/types/refund.types";
import { ROUTES } from "@/config/routes";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params.id as string) || null;
  const { data: order, isLoading } = useOrderDetail(orderId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [existingRefund, setExistingRefund] = useState<{ status: RefundStatus } | null>(null);
  const [checkingRefund, setCheckingRefund] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    refundService
      .getMyRefunds()
      .then((res) => {
        const found = (res?.items || []).find((r: { orderId: string }) => r.orderId === orderId);
        setExistingRefund(found ? { status: found.status as RefundStatus } : null);
      })
      .catch(() => {})
      .finally(() => setCheckingRefund(false));
  }, [orderId]);

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    setIsConfirming(true);
    try {
      await orderService.confirmReceived(orderId);
      toast.success("Order confirmed as received!");
      router.refresh();
    } catch {
      toast.error("Failed to confirm receipt.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <p className="text-gray-500">Order not found.</p>
        </div>
      </>
    );
  }

  const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-800">Order Details</h1>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {order.id}</p>
              </div>
              <div className="text-right">
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon} {meta.label}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">{formatDate(order.createdAtUtc)}</p>
              </div>
            </div>

            {/* Items */}
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#D35400]" /> Items
            </h2>
            <div className="space-y-3 mb-8">
              {order.items?.map((item) => (
                <div
                  key={item.dishId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.dishId.slice(0, 8)}...</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#D35400]">
                      {new Intl.NumberFormat("vi-VN").format(item.unitPrice * item.quantity)} pts
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Intl.NumberFormat("vi-VN").format(item.unitPrice)} pts each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-bold text-gray-800">{order.itemCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Price</span>
                <span className="font-black text-[#D35400] text-lg">
                  {new Intl.NumberFormat("vi-VN").format(order.totalPrice)} pts
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-xs text-gray-400">
                    {order.transactionId.slice(0, 8)}...
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {order.status === 1 && (
              <button
                onClick={handleConfirmReceived}
                disabled={isConfirming}
                className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirming ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm Received
              </button>
            )}

            {order.status === 3 && (
              <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Order Cancelled</p>
                  <p className="text-xs text-red-500 mt-1">
                    This order has been cancelled and will not be processed.
                  </p>
                </div>
              </div>
            )}

            {/* Refund status / button */}
            {!checkingRefund && existingRefund && (
              <div
                className="mt-6 rounded-2xl p-5 flex items-start gap-4 border"
                style={{
                  background: REFUND_STATUS_META[existingRefund.status].bg,
                  borderColor: REFUND_STATUS_META[existingRefund.status].color + "20",
                }}
              >
                {existingRefund.status === 0 ? (
                  <Clock
                    className="w-6 h-6 shrink-0 mt-0.5"
                    style={{ color: REFUND_STATUS_META[existingRefund.status].color }}
                  />
                ) : existingRefund.status === 1 ? (
                  <ThumbsUp
                    className="w-6 h-6 shrink-0 mt-0.5"
                    style={{ color: REFUND_STATUS_META[existingRefund.status].color }}
                  />
                ) : (
                  <ThumbsDown
                    className="w-6 h-6 shrink-0 mt-0.5"
                    style={{ color: REFUND_STATUS_META[existingRefund.status].color }}
                  />
                )}
                <div>
                  <p
                    className="text-base font-bold"
                    style={{ color: REFUND_STATUS_META[existingRefund.status].color }}
                  >
                    Yêu cầu hoàn tiền: {REFUND_STATUS_META[existingRefund.status].label}
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: REFUND_STATUS_META[existingRefund.status].color, opacity: 0.7 }}
                  >
                    {existingRefund.status === 0
                      ? "Đang chờ quản lý xử lý"
                      : existingRefund.status === 1
                        ? "Yêu cầu hoàn tiền đã được duyệt"
                        : "Yêu cầu hoàn tiền đã bị từ chối"}
                  </p>
                </div>
              </div>
            )}
            {!checkingRefund && !existingRefund && order.status === 2 && (
              <Link
                href={`${ROUTES.REFUND}?orderId=${orderId}`}
                className="w-full mt-6 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
              >
                <ShieldAlert className="w-5 h-5" /> Yêu cầu hoàn tiền
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
