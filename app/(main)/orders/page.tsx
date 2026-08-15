"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useMyOrders } from "@/lib/hooks/useCanteen";
import { type OrderStatus, type OrderListItem } from "@/types/order.types";
import { refundService } from "@/services/refund.service";
import { normalizeRefundStatus } from "@/types/refund.types";
import { ROUTES } from "@/config/routes";
import { ShoppingBag, Calendar, Filter, X, ChevronDown, Search, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSignalr,
  getOrderStatusLabelVi,
  type OrderStatusChangedPayload,
} from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";
import { toast } from "sonner";
import { OrdersStats } from "@/components/features/orders/orders-stats";
import { OrderCard } from "@/components/features/orders/order-card";
import { RefundFormModal } from "@/components/features/refund/refund-form-modal";

const TABS: { label: string; status: OrderStatus | null }[] = [
  { label: "Tất cả", status: null },
  { label: "Chờ xử lý", status: 0 },
  { label: "Đang chuẩn bị", status: 4 },
  { label: "Sẵn sàng", status: 1 },
  { label: "Hoàn thành", status: 2 },
  { label: "Đã hủy", status: 3 },
  { label: "Quá hạn", status: 7 },
];

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMounted = useIsMounted();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [refundMap, setRefundMap] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [refundModalOrderId, setRefundModalOrderId] = useState<string | null>(null);

  // Filter States
  const [dateFilterType, setDateFilterType] = useState<"created" | "sessionDate">("sessionDate");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);

  const hasActiveDateFilter = Boolean(fromDate || toDate);

  const { data: ordersData, isLoading } = useMyOrders({
    pageSize: 100,
    ...(dateFilterType === "created"
      ? {
          createdFrom: fromDate ? `${fromDate}T00:00:00Z` : undefined,
          createdTo: toDate ? `${toDate}T23:59:59Z` : undefined,
        }
      : {
          sessionDateFrom: fromDate ? `${fromDate}T00:00:00Z` : undefined,
          sessionDateTo: toDate ? `${toDate}T23:59:59Z` : undefined,
        }),
  });

  useSignalr(
    useCallback(
      (notification: NotificationItem) => {
        if (notification.type === "Order.StatusChanged" || notification.type === "Order.Created") {
          queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          refundService
            .getMyRefunds()
            .then((res) => {
              const map: Record<string, number> = {};
              (res?.items || []).forEach((r: { orderId: string; status: unknown }) => {
                map[r.orderId] = normalizeRefundStatus(r.status);
              });
              setRefundMap(map);
            })
            .catch(() => {});
        }
      },
      [queryClient],
    ),
    useCallback(
      (evt: OrderStatusChangedPayload) => {
        const labelVi = getOrderStatusLabelVi(evt.status, evt.statusName);
        const shortId = evt.orderId ? evt.orderId.slice(0, 8) : "";
        toast.info(`Đơn hàng #${shortId} chuyển sang: ${labelVi}`);
        queryClient.invalidateQueries({ queryKey: ["my-orders"] });
        refundService
          .getMyRefunds()
          .then((res) => {
            const map: Record<string, number> = {};
            (res?.items || []).forEach((r: { orderId: string; status: unknown }) => {
              map[r.orderId] = normalizeRefundStatus(r.status);
            });
            setRefundMap(map);
          })
          .catch(() => {});
      },
      [queryClient],
    ),
  );

  const allOrders: OrderListItem[] = (ordersData?.items as OrderListItem[]) || [];
  const tabFilteredOrders =
    activeTab !== null ? allOrders.filter((o) => o.status === activeTab) : allOrders;

  const orders = tabFilteredOrders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesId = order.id.toLowerCase().includes(term);
    const matchesSession = order.sessionName
      ? order.sessionName.toLowerCase().includes(term)
      : false;
    return matchesId || matchesSession;
  });

  // Stats calculation
  const totalCount = allOrders.length;
  const pendingCount = allOrders.filter(
    (o) => o.status === 0 || o.status === 4 || o.status === 1,
  ).length;
  const completedCount = allOrders.filter((o) => o.status === 2).length;

  // Total spent points calculation:
  // Includes active orders (Pending, Preparing, Ready, Completed) where money was deducted at placement.
  // Excludes Cancelled (status 3), Expired (status 7), and Approved Refunded orders (refundMap === 1).
  const totalSpentPoints = allOrders
    .filter((o) => {
      // Exclude cancelled and expired orders
      if (o.status === 3 || o.status === 7) return false;
      // Exclude orders where refund has been approved (status 1 = Approved)
      if (refundMap[o.id] === 1) return false;
      return true;
    })
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const getTabCount = (status: OrderStatus | null) => {
    if (status === null) return allOrders.length;
    return allOrders.filter((o) => o.status === status).length;
  };

  useEffect(() => {
    refundService
      .getMyRefunds()
      .then((res) => {
        const map: Record<string, number> = {};
        (res?.items || []).forEach((r: { orderId: string; status: unknown }) => {
          map[r.orderId] = normalizeRefundStatus(r.status);
        });
        setRefundMap(map);
      })
      .catch(() => {});
  }, []);

  const handleClearDateFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Title & Search/Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch sử đơn hàng</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Theo dõi quá trình chuẩn bị và lịch sử tất cả các đơn món ăn
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm đơn hàng, ca ăn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 focus:border-[#D35400] focus:outline-none rounded-xl text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Filter Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
                  className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border transition-all shadow-2xs ${
                    hasActiveDateFilter
                      ? "bg-orange-50 border-orange-300 text-[#D35400]"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lọc ngày</span>
                  {hasActiveDateFilter && <span className="w-2 h-2 rounded-full bg-[#D35400]" />}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showDateFilterDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Filter Popover */}
                {showDateFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-slate-700">Bộ lọc thời gian</span>
                      <button
                        onClick={() => setShowDateFilterDropdown(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Loại ngày</label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          onClick={() => setDateFilterType("sessionDate")}
                          className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                            dateFilterType === "sessionDate"
                              ? "bg-white text-[#D35400] shadow-2xs"
                              : "text-slate-600"
                          }`}
                        >
                          Ngày phục vụ (Ca)
                        </button>
                        <button
                          onClick={() => setDateFilterType("created")}
                          className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                            dateFilterType === "created"
                              ? "bg-white text-[#D35400] shadow-2xs"
                              : "text-slate-600"
                          }`}
                        >
                          Ngày đặt đơn
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Từ ngày
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-transparent text-xs text-slate-800 outline-none w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Đến ngày
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-transparent text-xs text-slate-800 outline-none w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <button
                        onClick={handleClearDateFilters}
                        disabled={!hasActiveDateFilter}
                        className="text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Xóa lọc
                      </button>
                      <button
                        onClick={() => setShowDateFilterDropdown(false)}
                        className="px-3.5 py-1.5 bg-[#D35400] text-white text-xs font-semibold rounded-lg hover:bg-[#b04600] transition-colors"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <OrdersStats
            totalCount={totalCount}
            pendingCount={pendingCount}
            completedCount={completedCount}
            totalSpentPoints={totalSpentPoints}
          />

          {/* Navigation Tabs (Underline / Minimal Style) */}
          <div className="border-b border-slate-200">
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => {
                const count = getTabCount(tab.status);
                const isActive = activeTab === tab.status;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.status)}
                    className={`py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "border-[#D35400] text-[#D35400]"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-orange-100 text-[#D35400]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Header Bar (Desktop alignment guide) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-5">Đơn hàng & Ca ăn</div>
            <div className="col-span-2">Trạng thái</div>
            <div className="col-span-2">Tổng tiền</div>
            <div className="col-span-3 text-right">Thao tác</div>
          </div>

          {/* Orders Table Container */}
          {!isMounted || isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white rounded-2xl border border-slate-200/80 animate-pulse p-4"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">
                Không tìm thấy đơn hàng nào
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `Không có đơn hàng phù hợp với từ khóa "${searchTerm}".`
                  : fromDate || toDate
                    ? "Không tìm thấy đơn hàng phù hợp với thời gian đã chọn."
                    : "Bạn chưa có đơn hàng nào trong danh sách."}
              </p>
              <Link
                href={ROUTES.SESSION}
                className="inline-block px-5 py-2.5 bg-[#D35400] text-white text-xs font-semibold rounded-full hover:bg-[#b04600] transition-colors shadow-2xs"
              >
                Đặt món ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  refundStatus={refundMap[order.id]}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  onRefundClick={(e) => {
                    e.stopPropagation();
                    setRefundModalOrderId(order.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Refund Request Form Modal */}
      <RefundFormModal
        isOpen={Boolean(refundModalOrderId)}
        orderId={refundModalOrderId}
        onClose={() => setRefundModalOrderId(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          refundService
            .getMyRefunds()
            .then((res) => {
              const map: Record<string, number> = {};
              (res?.items || []).forEach((r: { orderId: string; status: unknown }) => {
                map[r.orderId] = normalizeRefundStatus(r.status);
              });
              setRefundMap(map);
            })
            .catch(() => {});
        }}
      />
    </>
  );
}
