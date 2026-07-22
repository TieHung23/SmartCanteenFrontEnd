"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  ArrowLeftRight,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { changeProposalService } from "@/services/change-proposal.service";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import type { OrderDetail, OrderItem } from "@/types/order.types";
import type { SessionDishInfo } from "@/types/session.types";

interface ProposalGroup {
  orderId: string;
  orderCode: string;
  userName: string;
  sessionId: string;
  sessionName: string;
  items: OrderItem[];
}

export default function StaffChangeProposalsPage() {
  const [groups, setGroups] = useState<ProposalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [swappingItem, setSwappingItem] = useState<OrderItem | null>(null);
  const [sessionDishes, setSessionDishes] = useState<SessionDishInfo[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const allOrders = await orderService.getAll({ pageSize: 50, pageNumber: 1 });
      if (!allOrders?.items?.length) {
        setGroups([]);
        return;
      }
      const details = await Promise.all(
        allOrders.items.map((o) => orderService.getOrderById(o.id).catch(() => null)),
      );
      const valid = details.filter(
        (d): d is OrderDetail => d !== null && d.items?.some((i) => i.itemStatus === 2),
      );
      const mapped: ProposalGroup[] = valid.map((d) => {
        const raw = d as unknown as Record<string, string | undefined>;
        return {
          orderId: d.id,
          orderCode: d.id.slice(0, 8).toUpperCase(),
          userName: raw["userName"] || raw["UserName"] || "Khách",
          sessionId: d.sessionId,
          sessionName: "",
          items: d.items.filter((i) => i.itemStatus === 2),
        };
      });
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
      toast.error("Không thể tải danh sách đề xuất đổi món.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProposals();
  }, [fetchProposals]);

  const handleOpenSwapModal = async (item: OrderItem, sessionId: string) => {
    setSwappingItem(item);
    setLoadingDishes(true);
    try {
      const session = await sessionService.getSessionDetail(sessionId);
      const available = (session.dishes || []).filter(
        (d) => d.dishId !== item.dishId && d.preparedQuantity !== 0,
      );
      setSessionDishes(available);
    } catch {
      toast.error("Không thể tải danh sách món thay thế.");
      setSwappingItem(null);
    } finally {
      setLoadingDishes(false);
    }
  };

  const handleConfirmSwap = async (newDishId: string) => {
    if (!swappingItem?.proposalId) {
      toast.error("Không tìm thấy thông tin đề xuất.");
      return;
    }
    setSwapping(true);
    try {
      await changeProposalService.accept(swappingItem.proposalId, newDishId);
      toast.success("Đã đổi món thành công!");
      setSwappingItem(null);
      fetchProposals();
    } catch {
      toast.error("Lỗi khi thực hiện đổi món.");
    } finally {
      setSwapping(false);
    }
  };

  const handleConfirmRefund = async (item: OrderItem) => {
    if (!item.proposalId) {
      toast.error("Không tìm thấy thông tin đề xuất.");
      return;
    }
    const result = await Swal.fire({
      title: "Hoàn tiền cho món này?",
      text: "Xác nhận hoàn tiền cho khách hàng? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận hoàn tiền",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    setRefunding(true);
    try {
      await changeProposalService.requestRefund(item.proposalId);
      toast.success("Đã hoàn tiền thành công!");
      fetchProposals();
    } catch {
      toast.error("Lỗi khi hoàn tiền.");
    } finally {
      setRefunding(false);
    }
  };

  const filtered = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.orderCode.includes(q) ||
      g.userName.toLowerCase().includes(q) ||
      g.items.some((i) => i.dishName?.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Đề xuất đổi món</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các món ăn cần xử lý do thiếu số lượng
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
          placeholder="Tìm theo mã đơn, tên khách hàng, tên món..."
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
            {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Tất cả các đơn hàng đã được xử lý"}
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
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-sm font-semibold text-gray-600">{group.userName}</span>
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
                    {group.items.length} món
                  </span>
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
                    <div key={item.proposalId || idx} className="px-6 py-4">
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenSwapModal(item, group.sessionId)}
                            disabled={swapping || refunding}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                            Đổi món
                          </button>
                          <button
                            onClick={() => handleConfirmRefund(item)}
                            disabled={swapping || refunding}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Banknote className="w-4 h-4" />
                            Hoàn tiền
                          </button>
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

      {/* ── SWAP MODAL ── */}
      {swappingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Chọn món thay thế</h2>
              <p className="text-sm text-gray-500 mt-1">
                Đổi món <span className="font-bold text-gray-700">{swappingItem.dishName}</span>{" "}
                thành:
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {loadingDishes ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D35400]" />
                </div>
              ) : sessionDishes.length === 0 ? (
                <p className="text-center py-16 text-gray-400 font-semibold">
                  Không có món ăn thay thế khả dụng
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sessionDishes.map((dish) => (
                    <button
                      key={dish.dishId}
                      onClick={() => handleConfirmSwap(dish.dishId)}
                      disabled={swapping}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-[#D35400]/30 hover:bg-orange-50/50 transition-all text-left disabled:opacity-50"
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <Image
                          src={dish.imgUrl || "/placeholder-food.png"}
                          alt={dish.dishName || ""}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{dish.dishName}</p>
                        {dish.priceAmount != null && (
                          <p className="text-xs font-semibold text-[#D35400]">
                            {dish.priceAmount.toLocaleString()}đ
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSwappingItem(null)}
                disabled={swapping}
                className="px-6 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for actions */}
      {(swapping || refunding) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-lg" />
        </div>
      )}
    </>
  );
}
