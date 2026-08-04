"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowLeftRight,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import { changeProposalService } from "@/services/change-proposal.service";
import { ORDER_ITEM_STATUS_META } from "@/types/order.types";
import type { OrderDetail, OrderItem, ChangeProposalDetail } from "@/types/order.types";

interface ProposalGroup {
  orderId: string;
  orderCode: string;
  sessionId: string;
  sessionName: string;
  items: OrderItem[];
  proposals?: ChangeProposalDetail[];
}

export default function StaffChangeProposalsPage() {
  const [groups, setGroups] = useState<ProposalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [swappingProposal, setSwappingProposal] = useState<ChangeProposalDetail | null>(null);
  const [swapDishes, setSwapDishes] = useState<
    { dishId: string; dishName: string; imgUrl?: string | null; priceAmount?: number }[]
  >([]);
  const [loadingSwapDishes, setLoadingSwapDishes] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      // Primary fetch: Call changeProposalService.getAll
      const proposals = await changeProposalService.getAll({ pageSize: 100 });
      if (proposals && proposals.length > 0) {
        // Group proposals by orderId
        const groupMap = new Map<string, ChangeProposalDetail[]>();
        proposals.forEach((p) => {
          const list = groupMap.get(p.orderId) || [];
          list.push(p);
          groupMap.set(p.orderId, list);
        });

        const mappedGroups: ProposalGroup[] = Array.from(groupMap.entries()).map(
          ([orderId, props]) => ({
            orderId,
            orderCode: orderId.slice(0, 8).toUpperCase(),
            sessionId: "",
            sessionName: "Đề xuất đổi món",
            items: props.map((p) => ({
              proposalId: p.id,
              dishId: p.currentDishId,
              dishName: p.currentDishName,
              quantity: 1,
              unitPrice: 0,
              itemStatus: 2,
            })),
            proposals: props,
          }),
        );
        setGroups(mappedGroups);
        return;
      }

      // Fallback: fetch orders with pending change status items
      const allOrders = await orderService.getAll({ pageSize: 100, pageNumber: 1 });
      if (!allOrders?.items?.length) {
        setGroups([]);
        return;
      }
      const details = await Promise.all(
        allOrders.items.map((o) => orderService.getOrderById(o.id).catch(() => null)),
      );
      const valid = details.filter(
        (d): d is OrderDetail =>
          d !== null && d.items?.some((i) => i.itemStatus === 2 || i.itemStatus === 5),
      );
      const mapped: ProposalGroup[] = valid.map((d) => ({
        orderId: d.id,
        orderCode: d.id.slice(0, 8).toUpperCase(),
        sessionId: d.sessionId,
        sessionName: "",
        items: d.items.filter((i) => i.itemStatus === 2 || i.itemStatus === 5),
      }));
      const groupsWithSession = await Promise.all(
        mapped.map(async (g) => {
          try {
            const s = await sessionService.getSessionDetail(g.sessionId);
            return { ...g, sessionName: s.name || "" };
          } catch {
            return g;
          }
        }),
      );
      setGroups(groupsWithSession);
    } catch {
      toast.error("Không thể tải danh sách đề xuất.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefundProposal = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await changeProposalService.requestRefund(proposalId);
      toast.success("Hoàn tiền món thành công! Số tiền đã được tự động cộng vào ví.");
      fetchProposals();
    } catch {
      toast.error("Không thể thực hiện hoàn tiền món.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenSwapModal = async (proposal: ChangeProposalDetail) => {
    const result = await Swal.fire({
      title: "Đổi món?",
      text: `Bạn muốn đổi "${proposal.currentDishName}" sang món khác?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Chọn món thay thế",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-150 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setSwappingProposal(proposal);
    setLoadingSwapDishes(true);
    try {
      const order = await orderService.getOrderById(proposal.orderId);
      const session = await sessionService.getSessionDetail(order.sessionId);
      let available = (session.dishes || []).filter(
        (d) =>
          d.dishId?.toLowerCase() !== proposal.currentDishId?.toLowerCase() &&
          d.preparedQuantity !== 0 &&
          d.preparedQuantity !== null &&
          d.preparedQuantity !== undefined,
      );
      if (available.length === 0) {
        available = (session.dishes || []).filter(
          (d) => d.dishId?.toLowerCase() !== proposal.currentDishId?.toLowerCase(),
        );
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
    } catch {
      toast.error("Không thể thực hiện đổi món.");
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProposals();
  }, [fetchProposals]);

  const filtered = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.orderCode.toLowerCase().includes(q) ||
      g.sessionName.toLowerCase().includes(q) ||
      g.items.some((i) => i.dishName?.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Đề xuất đổi món</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi các đơn hàng có món cần khách hàng xử lý
          </p>
        </div>
        <button
          onClick={fetchProposals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã đơn, tên ca, tên món..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
          <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-700">
            {searchQuery ? "Không tìm thấy kết quả" : "Không có đề xuất đổi món nào"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Tất cả đơn hàng đã được xử lý"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((group) => (
            <div
              key={group.orderId}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedOrder(expandedOrder === group.orderId ? null : group.orderId)
                }
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-left">
                    <span className="font-bold text-gray-900">{group.orderCode}</span>
                    {group.sessionName && (
                      <>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-sm text-gray-500">{group.sessionName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    {group.items.length} món chờ xử lý
                  </span>
                  <Link
                    href={`/orders/${group.orderId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold text-[#D35400] hover:text-[#b04600] flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Chi tiết
                  </Link>
                  {expandedOrder === group.orderId ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedOrder === group.orderId && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {group.items.map((item, idx) => (
                    <div key={`${item.dishId}-${idx}`} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            <Image
                              src={item.imgUrl || "/placeholder-food.png"}
                              alt={item.dishName || ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {item.dishName || "Món ăn"}
                            </p>
                            <p className="text-xs text-gray-500">
                              SL: {item.quantity} • {item.unitPrice?.toLocaleString()}đ
                            </p>
                            {(() => {
                              const proposal = group.proposals?.find(
                                (p) => p.id === item.proposalId,
                              );
                              return proposal?.responseDeadlineUtc ? (
                                <p className="text-[10px] font-bold text-amber-600 mt-0.5">
                                  ⏰ Hạn:{" "}
                                  {new Date(proposal.responseDeadlineUtc).toLocaleString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </p>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-lg"
                            style={{
                              color: ORDER_ITEM_STATUS_META[item.itemStatus ?? 0].color,
                              backgroundColor: ORDER_ITEM_STATUS_META[item.itemStatus ?? 0].bg,
                            }}
                          >
                            {ORDER_ITEM_STATUS_META[item.itemStatus ?? 0].label}
                          </span>
                          {item.proposalId && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const proposal = group.proposals?.find(
                                    (p) => p.id === item.proposalId,
                                  );
                                  if (proposal && proposal.proposalStatus === 0) {
                                    handleOpenSwapModal(proposal);
                                  }
                                }}
                                disabled={
                                  processingId === item.proposalId ||
                                  !group.proposals
                                    ?.find((p) => p.id === item.proposalId)
                                    ?.allowedActions?.includes("SwapItem")
                                }
                                className="px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                              >
                                <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                                Đổi món
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefundProposal(item.proposalId!)}
                                disabled={processingId === item.proposalId}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                              >
                                {processingId === item.proposalId
                                  ? "Đang xử lý..."
                                  : "Hoàn tiền món"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
    </>
  );
}
