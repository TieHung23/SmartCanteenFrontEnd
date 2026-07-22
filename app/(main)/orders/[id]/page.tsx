"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useOrderDetail } from "@/lib/hooks/useCanteen";
import {
  ORDER_STATUS_META,
  ORDER_ITEM_STATUS_META,
  type OrderStatus,
  type OrderItem,
} from "@/types/order.types";
import { orderService } from "@/services/order.service";
import { refundService } from "@/services/refund.service";
import { changeProposalService } from "@/services/change-proposal.service";
import { sessionService } from "@/services/session.service";
import { REFUND_STATUS_META, type RefundStatus, normalizeRefundStatus } from "@/types/refund.types";
import type { SessionDishInfo } from "@/types/session.types";
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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useState, useEffect, useCallback } from "react";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
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
  const queryClient = useQueryClient();
  const orderId = (params.id as string) || null;
  const { data: order, isLoading } = useOrderDetail(orderId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [existingRefund, setExistingRefund] = useState<{ status: RefundStatus } | null>(null);
  const [checkingRefund, setCheckingRefund] = useState(true);

  // States for Change Proposal
  const [swappingItem, setSwappingItem] = useState<OrderItem | null>(null);
  const [sessionDishes, setSessionDishes] = useState<SessionDishInfo[]>([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const handleOpenSwapModal = async (item: OrderItem) => {
    if (!order?.sessionId) return;
    setSwappingItem(item);
    setIsLoadingDishes(true);
    try {
      const session = await sessionService.getSessionDetail(order.sessionId);
      // Filter out the current dish and any dishes with preparedQuantity === 0
      const available = (session.dishes || []).filter(
        (d) => d.dishId !== item.dishId && d.preparedQuantity !== 0,
      );
      setSessionDishes(available);
    } catch {
      toast.error("Không thể tải danh sách món ăn thay thế.");
      setSwappingItem(null);
    } finally {
      setIsLoadingDishes(false);
    }
  };

  const handleConfirmSwap = async (newDishId: string) => {
    if (!swappingItem?.proposalId) {
      toast.error("Không tìm thấy thông tin đề xuất đổi món.");
      return;
    }
    setIsSwapping(true);
    try {
      await changeProposalService.accept(swappingItem.proposalId, newDishId);
      toast.success("Đổi món thành công!");
      setSwappingItem(null);
      window.location.reload();
    } catch {
      toast.error("Lỗi khi thực hiện đổi món.");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleConfirmRefund = async (item: OrderItem) => {
    if (!item.proposalId) {
      toast.error("Không tìm thấy thông tin đề xuất hoàn tiền.");
      return;
    }

    const result = await Swal.fire({
      title: "Yêu cầu hoàn tiền?",
      text: "Bạn có chắc chắn muốn yêu cầu hoàn tiền cho món ăn này không? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Đồng ý hoàn tiền",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-150 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setIsRefunding(true);
    try {
      await changeProposalService.requestRefund(item.proposalId);
      toast.success("Yêu cầu hoàn tiền thành công!");
      window.location.reload();
    } catch {
      toast.error("Lỗi khi gửi yêu cầu hoàn tiền.");
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    refundService
      .getMyRefunds()
      .then((res) => {
        const found = (res?.items || []).find((r: { orderId: string }) => r.orderId === orderId);
        setExistingRefund(found ? { status: normalizeRefundStatus(found.status) } : null);
      })
      .catch(() => {})
      .finally(() => setCheckingRefund(false));
  }, [orderId]);

  useSignalr(
    useCallback(
      (notification: NotificationItem) => {
        if (
          (notification.type === "Order.StatusChanged" || notification.type === "Order.Created") &&
          notification.referenceId === orderId
        ) {
          queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
        }
      },
      [orderId, queryClient],
    ),
  );

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    setIsConfirming(true);
    try {
      await orderService.confirmReceived(orderId);
      toast.success("Xác nhận đã nhận đơn thành công!");
      router.refresh();
    } catch {
      toast.error("Xác nhận thất bại.");
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
          <p className="text-gray-500">Không tìm thấy đơn hàng.</p>
        </div>
      </>
    );
  }

  const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
          </button>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <div>
                <h1 className="text-3xl font-black text-gray-800">Chi tiết đơn hàng</h1>
                <p className="text-sm text-gray-400 font-mono mt-1">ID: {order.id}</p>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-black px-4 py-2 rounded-xl"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon} {meta.label}
                </span>
                <p className="text-xs text-gray-400 mt-2 font-semibold">
                  {formatDate(order.createdAtUtc)}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D35400]" /> Món ăn
            </h2>
            <div className="space-y-4 mb-8">
              {order.items?.map((item) => (
                <div
                  key={item.dishId}
                  className="flex flex-col p-5 md:p-6 bg-gray-50 rounded-2xl border border-gray-100/50 gap-4"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      {item.imgUrl && (
                        <Image
                          src={item.imgUrl}
                          alt={item.dishName || ""}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-100 shadow-3xs"
                        />
                      )}
                      <div className="flex flex-col">
                        <p className="text-base font-extrabold text-gray-850">
                          {item.dishName || `${item.dishId.slice(0, 8)}...`}
                        </p>
                        <p className="text-sm text-gray-500 font-semibold mt-0.5">
                          Số lượng: {item.quantity}
                        </p>
                        {item.itemStatus !== undefined &&
                          ORDER_ITEM_STATUS_META[item.itemStatus] && (
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-lg inline-block mt-2 w-fit"
                              style={{
                                color: ORDER_ITEM_STATUS_META[item.itemStatus].color,
                                backgroundColor: ORDER_ITEM_STATUS_META[item.itemStatus].bg,
                              }}
                            >
                              {ORDER_ITEM_STATUS_META[item.itemStatus].label}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-base font-black text-[#D35400] flex items-center gap-0.5">
                        <span>
                          {new Intl.NumberFormat("vi-VN").format(item.unitPrice * item.quantity)}
                        </span>
                        <Image
                          src="/logo_point.png"
                          alt="coin"
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-0.5 font-medium">
                        <span>{new Intl.NumberFormat("vi-VN").format(item.unitPrice)}</span>
                        <Image
                          src="/logo_point.png"
                          alt="coin"
                          width={12}
                          height={12}
                          className="object-contain"
                        />
                        <span>/ món</span>
                      </p>
                    </div>
                  </div>

                  {item.itemStatus === 2 && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <p className="text-sm font-extrabold text-orange-950">
                            Món này bị thiếu số lượng!
                          </p>
                          <p className="text-xs font-semibold text-orange-700 mt-0.5">
                            Vui lòng chọn món khác thay thế hoặc yêu cầu hoàn tiền.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenSwapModal(item)}
                          disabled={isSwapping || isRefunding}
                          className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                          Đổi món
                        </button>
                        <button
                          onClick={() => handleConfirmRefund(item)}
                          disabled={isSwapping || isRefunding}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Hoàn tiền
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex justify-between text-base">
                <span className="text-gray-500 font-medium">Số món</span>
                <span className="font-extrabold text-gray-855">{order.itemCount}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-500 font-medium">Tổng tiền</span>
                <span className="font-black text-[#D35400] text-2xl flex items-center gap-1">
                  <span>{new Intl.NumberFormat("vi-VN").format(order.totalPrice)}</span>
                  <Image
                    src="/logo_point.png"
                    alt="coin"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </span>
              </div>
              {order.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mã giao dịch</span>
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
                Xác nhận đã nhận
              </button>
            )}

            {order.status === 3 && (
              <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Đơn hàng đã hủy</p>
                  <p className="text-xs text-red-500 mt-1">
                    Đơn hàng này đã bị hủy và sẽ không được xử lý.
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

      {/* Swap Dish Modal */}
      {swappingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-gray-800">Chọn Món Thay Thế</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Đổi món cho: {swappingItem.dishName}
                </p>
              </div>
              <button
                onClick={() => setSwappingItem(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-650 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isLoadingDishes ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35400] mb-3" />
                  <p className="text-sm text-gray-500 font-semibold">
                    Đang tải danh sách món ăn...
                  </p>
                </div>
              ) : sessionDishes.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400 font-semibold">
                    Phiên ăn hiện tại không có món khác khả dụng.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sessionDishes.map((dish) => (
                    <div
                      key={dish.dishId}
                      onClick={() => !isSwapping && handleConfirmSwap(dish.dishId)}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-orange-50/30 hover:border-orange-200 border border-gray-100 rounded-2xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {dish.imgUrl && (
                          <Image
                            src={dish.imgUrl}
                            alt={dish.dishName || ""}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-200"
                          />
                        )}
                        <div>
                          <p className="text-sm font-extrabold text-gray-800 group-hover:text-[#D35400] transition-colors">
                            {dish.dishName}
                          </p>
                          {dish.priceAmount !== undefined && (
                            <p className="text-xs text-[#D35400] font-black flex items-center gap-0.5 mt-0.5">
                              <span>{new Intl.NumberFormat("vi-VN").format(dish.priceAmount)}</span>
                              <Image
                                src="/logo_point.png"
                                alt="coin"
                                width={12}
                                height={12}
                                className="object-contain"
                              />
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs font-bold text-gray-400 group-hover:text-[#D35400] transition-colors flex items-center gap-1">
                        {isSwapping ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D35400]" />
                        ) : (
                          <>
                            <span>Chọn</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSwappingItem(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
