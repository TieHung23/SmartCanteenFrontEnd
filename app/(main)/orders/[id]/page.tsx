"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useOrderDetail } from "@/lib/hooks/useCanteen";
import {
  ORDER_STATUS_META,
  ORDER_ITEM_STATUS_META,
  CHANGE_PROPOSAL_STATUS_META,
  type OrderStatus,
  type OrderItem,
  type ChangeProposalDetail,
  type AllowedAction,
} from "@/types/order.types";
import { orderService } from "@/services/order.service";
import { changeProposalService } from "@/services/change-proposal.service";
import { sessionService } from "@/services/session.service";
import { refundService } from "@/services/refund.service";
import { normalizeRefundStatus, type RefundRequest } from "@/types/refund.types";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Undo2,
  Ban,
  UtensilsCrossed,
  Clock,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { translateApiMessage } from "@/lib/utils";
import Swal from "sweetalert2";
import { useState, useEffect, useCallback } from "react";
import { RefundFormModal } from "@/components/features/refund/refund-form-modal";
import {
  useSignalr,
  getOrderStatusLabelVi,
  type OrderStatusChangedPayload,
} from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";
import { useQueryClient } from "@tanstack/react-query";
import { CancelOrderModal } from "@/components/features/orders/cancel-order-modal";

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

  const [proposals, setProposals] = useState<ChangeProposalDetail[]>([]);
  const [orderRefund, setOrderRefund] = useState<RefundRequest | null>(null);

  const [swappingProposal, setSwappingProposal] = useState<ChangeProposalDetail | null>(null);
  const [swapDishes, setSwapDishes] = useState<
    { dishId: string; dishName: string; imgUrl?: string | null; priceAmount?: number }[]
  >([]);
  const [loadingSwapDishes, setLoadingSwapDishes] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isRefundingOrder, setIsRefundingOrder] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRefundFormModalOpen, setIsRefundFormModalOpen] = useState(false);

  const [sessionInfo, setSessionInfo] = useState<{
    name?: string;
    timeRange?: string;
    sessionDate?: string;
    availableTo?: string;
    isExpired?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!order?.sessionId) {
      if (order?.sessionName) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessionInfo({ name: order.sessionName });
      }
      return;
    }
    sessionService
      .getSessionDetail(order.sessionId)
      .then((session) => {
        if (session) {
          let timeRange = "";
          let sessionDate = "";
          let isExpired = false;
          if (session.availableFrom && session.availableTo) {
            const fromTime = new Date(session.availableFrom).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const toTime = new Date(session.availableTo).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            timeRange = `${fromTime} - ${toTime}`;
            sessionDate = new Date(session.availableFrom).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            isExpired = new Date(session.availableTo) < new Date();
          }
          setSessionInfo({
            name: session.name || order.sessionName || "Phiên ăn",
            timeRange,
            sessionDate,
            availableTo: session.availableTo,
            isExpired,
          });
        }
      })
      .catch(() => {
        if (order?.sessionName) {
          setSessionInfo({ name: order.sessionName });
        }
      });
  }, [order?.sessionId, order?.sessionName]);

  const fetchProposals = useCallback(async () => {
    if (!orderId) return;
    try {
      const all = await changeProposalService.getAll();
      const filtered = all.filter((p) => p.orderId?.toLowerCase() === orderId.toLowerCase());
      setProposals(filtered);
    } catch {
      setProposals([]);
    }
  }, [orderId]);

  const fetchRefunds = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await refundService.getMyRefunds({ pageSize: 50 });
      const found = res?.items?.find((r) => r.orderId?.toLowerCase() === orderId.toLowerCase());
      setOrderRefund(found || null);
    } catch {
      setOrderRefund(null);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProposals();
      fetchRefunds();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProposals, fetchRefunds]);

  const handleOpenSwapModal = async (proposal: ChangeProposalDetail) => {
    if (!order?.sessionId) return;
    setSwappingProposal(proposal);
    setLoadingSwapDishes(true);
    try {
      const session = await sessionService.getSessionDetail(order.sessionId);
      const currentSessionDish = (session.dishes || []).find(
        (d) => d.dishId?.toLowerCase() === proposal.currentDishId?.toLowerCase(),
      );
      const targetCategoryId = proposal.requiredCategoryId || currentSessionDish?.categoryId;

      let available = (session.dishes || []).filter((d) => {
        const isDifferentDish = d.dishId?.toLowerCase() !== proposal.currentDishId?.toLowerCase();
        const isPrepared =
          d.preparedQuantity !== 0 &&
          d.preparedQuantity !== null &&
          d.preparedQuantity !== undefined;
        const matchesCategory = targetCategoryId ? d.categoryId === targetCategoryId : true;
        return isDifferentDish && isPrepared && matchesCategory;
      });

      if (available.length === 0) {
        available = (session.dishes || []).filter((d) => {
          const isDifferentDish = d.dishId?.toLowerCase() !== proposal.currentDishId?.toLowerCase();
          const isPrepared =
            d.preparedQuantity !== 0 &&
            d.preparedQuantity !== null &&
            d.preparedQuantity !== undefined;
          return isDifferentDish && isPrepared;
        });
      }

      setSwapDishes(
        available.map((d) => ({
          dishId: d.dishId,
          dishName: d.dishName || "",
          imgUrl: d.imgUrl,
          priceAmount: d.priceAmount,
        })),
      );
      if (available.length === 0) {
        toast.warning("Không có món ăn thay thế phù hợp trong ca ăn này.");
        setSwappingProposal(null);
      }
    } catch {
      toast.error("Không thể tải danh sách món ăn thay thế.");
      setSwappingProposal(null);
    } finally {
      setLoadingSwapDishes(false);
    }
  };

  const handleConfirmSwap = async (newDishId: string) => {
    if (!swappingProposal) return;
    setIsSwapping(true);
    try {
      await changeProposalService.accept(swappingProposal.id, newDishId);
      toast.success("Đổi món thành công!");
      setSwappingProposal(null);
      fetchProposals();
      fetchRefunds();
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const raw = axiosErr?.response?.data?.message;
      toast.error(raw ? translateApiMessage(raw) : "Lỗi khi thực hiện đổi món.");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleRequestRefund = async (proposal: ChangeProposalDetail) => {
    const result = await Swal.fire({
      title: "Hoàn tiền món ăn này?",
      text: "Số tiền món ăn sẽ được tự động hoàn trực tiếp vào ví của bạn ngay lập tức.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận hoàn tiền",
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
      await changeProposalService.requestRefund(proposal.id);
      toast.success("Hoàn tiền món thành công! Số tiền đã được tự động cộng vào ví.");
      fetchProposals();
      fetchRefunds();
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const raw = axiosErr?.response?.data?.message;
      toast.error(raw ? translateApiMessage(raw) : "Lỗi khi gửi yêu cầu hoàn tiền.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRequestOrderRefund = async (proposal: ChangeProposalDetail) => {
    const result = await Swal.fire({
      title: "Hủy đơn & hoàn tiền toàn bộ?",
      text: "Đơn hàng sẽ bị hủy và toàn bộ số tiền (các món chưa hoàn) sẽ được tự động hoàn trực tiếp vào ví của bạn ngay lập tức.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận hủy đơn",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-150 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setIsRefundingOrder(true);
    try {
      await changeProposalService.requestOrderRefund(proposal.id);
      toast.success("Hủy đơn & hoàn tiền thành công! Số tiền đã được tự động cộng vào ví.");
      fetchProposals();
      fetchRefunds();
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      const raw = axiosErr?.response?.data?.message;
      const errors = axiosErr?.response?.data?.errors;
      const detail = errors ? Object.values(errors).flat().join(". ") : "";
      toast.error(
        raw ? translateApiMessage(raw) : detail || "Lỗi khi gửi yêu cầu hoàn tiền toàn bộ.",
      );
    } finally {
      setIsRefundingOrder(false);
    }
  };

  useSignalr(
    useCallback(
      (notification: NotificationItem) => {
        const refType = notification.referenceType || "";
        const notifType = notification.type || "";
        if (
          refType === "Order" ||
          refType === "ChangeProposal" ||
          refType === "Refund" ||
          notifType.includes("Order") ||
          notifType.includes("ChangeProposal") ||
          notifType.includes("Refund")
        ) {
          queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
          fetchProposals();
          fetchRefunds();
        }
      },
      [orderId, queryClient, fetchProposals, fetchRefunds],
    ),
    useCallback(
      (evt: OrderStatusChangedPayload) => {
        if (evt?.orderId && orderId && evt.orderId.toLowerCase() === orderId.toLowerCase()) {
          const labelVi = getOrderStatusLabelVi(evt.status, evt.statusName);
          toast.info(`Trạng thái đơn hàng vừa được cập nhật: ${labelVi}`);

          queryClient.setQueryData(
            ["order-detail", orderId],
            (oldData: typeof order | undefined) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                status: evt.status as OrderStatus,
              };
            },
          );

          queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
          queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          fetchProposals();
          fetchRefunds();
        }
      },
      [orderId, queryClient, fetchProposals, fetchRefunds],
    ),
  );

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    setIsConfirming(true);
    try {
      await orderService.confirmReceived(orderId);
      toast.success("Xác nhận đã nhận đơn thành công!");
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      router.refresh();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const raw = axiosErr?.response?.data?.message;
      toast.error(raw ? translateApiMessage(raw) : "Xác nhận thất bại.");
    } finally {
      setIsConfirming(false);
    }
  };

  const getProposalForItem = (item: OrderItem): ChangeProposalDetail | undefined => {
    if (!proposals || proposals.length === 0) return undefined;
    let found = proposals.find(
      (p) => p.currentDishId?.toLowerCase() === item.dishId?.toLowerCase(),
    );
    if (found) return found;
    if (item.itemStatus === 2) {
      found = proposals.find((p) => p.proposalStatus !== 1);
    }
    return found;
  };

  const hasAllowedAction = (proposal: ChangeProposalDetail, action: AllowedAction): boolean => {
    return proposal.allowedActions.includes(action);
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

  const refundStatusNum = orderRefund ? normalizeRefundStatus(orderRefund.status) : null;
  const isOrderRefundApproved =
    refundStatusNum === 2 ||
    (order.items &&
      order.items.length > 0 &&
      order.items.every((i) => i.itemStatus === 4 || i.itemStatus === 3));
  const isOrderRefundRejected =
    refundStatusNum === 3 &&
    !isOrderRefundApproved &&
    order.items?.some((i) => i.itemStatus !== 4 && i.itemStatus !== 3);
  const isOrderRefundPending =
    orderRefund && !orderRefund.changeProposalId && refundStatusNum === 1;

  const rawMeta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];
  const meta =
    isOrderRefundApproved || (order.status === 3 && !isOrderRefundRejected && !isOrderRefundPending)
      ? { label: "Đã hủy & Hoàn tiền", color: "#8b5cf6", bg: "#f3e8ff", icon: "💰" }
      : isOrderRefundRejected
        ? { label: "Từ chối hoàn đơn", color: "#dc2626", bg: "#fef2f2", icon: "⚠️" }
        : isOrderRefundPending
          ? { label: "Chờ duyệt hoàn đơn", color: "#d97706", bg: "#fffbeb", icon: "⏳" }
          : rawMeta;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
          </button>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
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

            {/* Session & Order Timing Summary Banner */}
            <div className="bg-orange-50/70 border border-orange-200/70 rounded-2xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-[#D35400] shrink-0 shadow-2xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Ca / Phiên ăn
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {sessionInfo?.name || order.sessionName || "Chưa có thông tin ca"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-orange-200/60 pt-3 sm:pt-0 sm:pl-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-[#D35400] shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Giờ phục vụ ca
                  </p>
                  <div className="text-sm font-extrabold text-gray-900">
                    {sessionInfo?.timeRange ? (
                      <>
                        <span>{sessionInfo.timeRange}</span>
                        {sessionInfo.sessionDate && (
                          <span className="block text-xs font-semibold text-gray-500 capitalize mt-0.5">
                            {sessionInfo.sessionDate}
                          </span>
                        )}
                      </>
                    ) : (
                      "Đang cập nhật"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-orange-200/60 pt-3 sm:pt-0 sm:pl-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-[#D35400] shrink-0 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Ngày giờ đặt đơn
                  </p>
                  <p className="text-sm font-extrabold text-gray-900">
                    {formatDate(order.createdAtUtc)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expired Session Notice Banner */}
            {sessionInfo?.isExpired && (order.status === 4 || order.status === 0) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 text-xs font-bold shadow-2xs mb-6">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-sm text-amber-950">
                    ⚠️ Ca phục vụ này đã kết thúc!
                  </p>
                  <p className="text-amber-800 mt-1 font-medium leading-relaxed">
                    Ca phục vụ này đã quá hạn. Đơn hàng chưa được lấy trong ca. Vui lòng bấm nút{" "}
                    <span className="font-black text-[#D35400] underline">
                      &quot;Yêu cầu hoàn tiền&quot;
                    </span>{" "}
                    ở góc bên dưới để nhận 100% tiền hoàn vào ví cá nhân.
                  </p>
                </div>
              </div>
            )}

            {/* Items */}
            <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D35400]" /> Món ăn
            </h2>
            <div className="space-y-4 mb-8">
              {order.items?.map((item) => {
                const proposal = getProposalForItem(item);
                const showProposalPanel =
                  item.itemStatus === 2 || (proposal && proposal.proposalStatus !== 1);
                return (
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

                    {/* Proposal action panel */}
                    {showProposalPanel && (
                      <div
                        className={`p-4 rounded-xl flex flex-col gap-3 w-full border ${
                          proposal?.proposalStatus === 3
                            ? "bg-purple-50/80 border-purple-200"
                            : proposal?.proposalStatus === 2
                              ? "bg-green-50/80 border-green-200"
                              : "bg-orange-50 border-orange-100"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertCircle
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              proposal?.proposalStatus === 3
                                ? "text-purple-600"
                                : proposal?.proposalStatus === 2
                                  ? "text-green-600"
                                  : "text-orange-600"
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-extrabold ${
                                proposal?.proposalStatus === 3
                                  ? "text-purple-950"
                                  : proposal?.proposalStatus === 2
                                    ? "text-green-950"
                                    : "text-orange-950"
                              }`}
                            >
                              {proposal?.proposalStatus === 3
                                ? "Đã hoàn tiền toàn bộ & hủy đơn"
                                : proposal?.proposalStatus === 2
                                  ? "Đã hoàn tiền món ăn vào ví"
                                  : proposal?.proposalStatus === 1
                                    ? "Đã đổi món"
                                    : "Món này bị thiếu số lượng!"}
                            </p>
                            <p
                              className={`text-xs font-semibold mt-0.5 ${
                                proposal?.proposalStatus === 3
                                  ? "text-purple-700"
                                  : proposal?.proposalStatus === 2
                                    ? "text-green-700"
                                    : "text-orange-700"
                              }`}
                            >
                              {proposal?.proposalStatus === 3
                                ? "Đơn hàng đã được hủy và tiền đã được tự động hoàn trả vào ví của bạn."
                                : proposal?.proposalStatus === 2
                                  ? "Số tiền cho món này đã được tự động cộng trực tiếp vào ví của bạn."
                                  : proposal?.suggestedDishName
                                    ? `Gợi ý: ${proposal.suggestedDishName}. Vui lòng chọn hành động thay thế.`
                                    : "Vui lòng chọn hành động thay thế."}
                            </p>
                            {proposal?.responseDeadlineUtc && proposal.proposalStatus === 0 && (
                              <p className="text-[11px] font-bold text-amber-800 mt-1.5 flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded-md w-fit">
                                ⏰ Hạn phản hồi:{" "}
                                {new Date(proposal.responseDeadlineUtc).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: ONLY show if full order refund is NOT pending and proposal status is WaitingResponse (0) */}
                        {!isOrderRefundPending && proposal && proposal.proposalStatus === 0 && (
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => handleOpenSwapModal(proposal)}
                              disabled={isSwapping || isRefunding || isRefundingOrder}
                              className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Đổi món
                            </button>

                            {hasAllowedAction(proposal, "RefundItem") && (
                              <button
                                onClick={() => handleRequestRefund(proposal)}
                                disabled={isSwapping || isRefunding || isRefundingOrder}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                              >
                                <Undo2 className="w-3.5 h-3.5 inline mr-1" />
                                Hoàn tiền món
                              </button>
                            )}

                            {hasAllowedAction(proposal, "RefundOrder") && (
                              <button
                                onClick={() => handleRequestOrderRefund(proposal)}
                                disabled={isSwapping || isRefunding || isRefundingOrder}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5 inline mr-1" />
                                Hủy đơn & hoàn tiền
                              </button>
                            )}
                          </div>
                        )}

                        {/* Status badge when proposal is not in WaitingResponse (0) */}
                        {proposal && proposal.proposalStatus !== 0 && (
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-lg w-fit"
                            style={{
                              color:
                                CHANGE_PROPOSAL_STATUS_META[proposal.proposalStatus]?.color ||
                                "#f07b2e",
                              backgroundColor:
                                CHANGE_PROPOSAL_STATUS_META[proposal.proposalStatus]?.bg ||
                                "#fff8f4",
                            }}
                          >
                            {CHANGE_PROPOSAL_STATUS_META[proposal.proposalStatus]?.label ||
                              "Chờ xử lý"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* itemStatus=5 (RefundPending) - show pending info */}
                    {item.itemStatus === 5 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-2.5 w-full">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-extrabold text-yellow-950">
                            Đang chờ quản lý duyệt hoàn tiền
                          </p>
                          <p className="text-xs font-semibold text-yellow-700 mt-0.5">
                            Yêu cầu hoàn tiền đang được xử lý. Bạn sẽ nhận thông báo khi hoàn tất.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isConfirming ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Xác nhận đã nhận
              </button>
            )}

            {/* Single Refund Request Button for Status 4 (Đang chuẩn bị) & Status 2 (Hoàn thành) */}
            {(order.status === 4 || order.status === 2) &&
              !orderRefund &&
              !isOrderRefundPending &&
              !isOrderRefundRejected && (
                <button
                  onClick={() => setIsRefundFormModalOpen(true)}
                  className="w-full mt-4 py-4 bg-orange-50 hover:bg-orange-100 text-[#D35400] border border-orange-200/80 font-black text-sm rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RotateCcw className="w-4 h-4 text-[#D35400]" />
                  Yêu cầu hoàn tiền
                </button>
              )}

            {order.status === 3 && (
              <div
                className={`mt-8 border rounded-xl p-5 flex items-start gap-3 ${
                  isOrderRefundRejected
                    ? "bg-red-50 border-red-200"
                    : isOrderRefundPending
                      ? "bg-amber-50 border-amber-200"
                      : "bg-purple-50 border-purple-200"
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isOrderRefundRejected
                      ? "text-red-600"
                      : isOrderRefundPending
                        ? "text-amber-600"
                        : "text-purple-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-extrabold ${
                      isOrderRefundRejected
                        ? "text-red-950"
                        : isOrderRefundPending
                          ? "text-amber-950"
                          : "text-purple-950"
                    }`}
                  >
                    {isOrderRefundRejected
                      ? "Yêu cầu hủy đơn & hoàn tiền đã bị từ chối"
                      : isOrderRefundPending
                        ? "Yêu cầu hoàn tiền đang chờ quản lý duyệt"
                        : "Đơn hàng đã hủy & tự động hoàn tiền vào ví"}
                  </p>
                  <p
                    className={`text-xs font-semibold mt-1 ${
                      isOrderRefundRejected
                        ? "text-red-700"
                        : isOrderRefundPending
                          ? "text-amber-700"
                          : "text-purple-700"
                    }`}
                  >
                    {isOrderRefundRejected
                      ? "Yêu cầu hoàn tiền đơn hàng của bạn đã bị từ chối. Vui lòng liên hệ bộ phận quản lý để biết thêm chi tiết."
                      : isOrderRefundPending
                        ? "Yêu cầu hoàn tiền đơn hàng đã được gửi tới Quản lý và đang chờ phê duyệt."
                        : "Đơn hàng này đã bị hủy và tiền đã được hệ thống tự động hoàn trực tiếp vào ví của bạn."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Swap Dish Modal */}
      {swappingProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-gray-800">Chọn Món Thay Thế</h3>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Đổi món: {swappingProposal.currentDishName}
                </p>
              </div>
              <button
                onClick={() => setSwappingProposal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-650 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingSwapDishes ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35400] mb-3" />
                  <p className="text-sm text-gray-500 font-semibold">
                    Đang tải danh sách món ăn...
                  </p>
                </div>
              ) : swapDishes.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400 font-semibold">Không có món khác khả dụng.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {swapDishes.map((dish) => (
                    <div
                      key={dish.dishId}
                      onClick={() => !isSwapping && handleConfirmSwap(dish.dishId)}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-orange-50/30 hover:border-orange-200 border border-gray-100 rounded-2xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {dish.imgUrl && (
                          <Image
                            src={dish.imgUrl}
                            alt={dish.dishName}
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

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSwappingProposal(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-xl transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {order && (
        <CancelOrderModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          orderId={order.id}
          totalPrice={order.totalPrice}
          onSuccess={() => {
            fetchProposals();
            fetchRefunds();
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          }}
        />
      )}

      {/* Refund Form Modal */}
      {order && (
        <RefundFormModal
          isOpen={isRefundFormModalOpen}
          orderId={order.id}
          onClose={() => setIsRefundFormModalOpen(false)}
          onSuccess={() => {
            fetchProposals();
            fetchRefunds();
            queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
            queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          }}
        />
      )}
    </>
  );
}
