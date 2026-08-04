"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useMyOrders } from "@/lib/hooks/useCanteen";
import { ORDER_STATUS_META, type OrderStatus, type OrderListItem } from "@/types/order.types";
import { refundService } from "@/services/refund.service";
import { REFUND_STATUS_META, normalizeRefundStatus } from "@/types/refund.types";
import { ROUTES } from "@/config/routes";
import {
  ClipboardList,
  ChevronRight,
  ShoppingBag,
  Clock,
  Calendar,
  Filter,
  X,
  ChevronDown,
  PackageCheck,
  Coins,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";

const TABS: { label: string; status: OrderStatus | null }[] = [
  { label: "Tất cả", status: null },
  { label: "Chờ xử lý", status: 0 },
  { label: "Đang chuẩn bị", status: 4 },
  { label: "Sẵn sàng", status: 1 },
  { label: "Hoàn thành", status: 2 },
  { label: "Đã hủy", status: 3 },
  { label: "Quá hạn", status: 7 },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [refundMap, setRefundMap] = useState<Record<string, number>>({});

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
  );

  const allOrders: OrderListItem[] = (ordersData?.items as OrderListItem[]) || [];
  const orders = activeTab !== null ? allOrders.filter((o) => o.status === activeTab) : allOrders;

  // Stats calculation
  const totalCount = allOrders.length;
  const pendingCount = allOrders.filter(
    (o) => o.status === 0 || o.status === 4 || o.status === 1,
  ).length;
  const completedCount = allOrders.filter((o) => o.status === 2).length;
  const totalSpentPoints = allOrders
    .filter((o) => o.status === 2)
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
        (res?.items || []).forEach((r: { orderId: string; status: number }) => {
          map[r.orderId] = r.status;
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
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header & Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#D35400] shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Đơn hàng của tôi
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Quản lý và theo dõi trạng thái các đơn hàng đặt món
                </p>
              </div>
            </div>

            {/* Filter Dropdown Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all shadow-xs ${
                  hasActiveDateFilter
                    ? "bg-orange-50 border-orange-300 text-[#D35400]"
                    : "bg-white border-gray-200 text-gray-700 hover:border-orange-200 hover:text-[#D35400]"
                }`}
              >
                <Filter className="w-4 h-4 text-[#D35400]" />
                <span>Lọc theo thời gian</span>
                {hasActiveDateFilter && <span className="w-2 h-2 rounded-full bg-[#D35400]" />}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showDateFilterDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Box Panel */}
              {showDateFilterDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#D35400]" /> Bộ lọc ngày
                    </span>
                    <button
                      onClick={() => setShowDateFilterDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Type Radio/Segment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Loại ngày lọc</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setDateFilterType("sessionDate")}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          dateFilterType === "sessionDate"
                            ? "bg-white text-[#D35400] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Ngày phục vụ (Ca)
                      </button>
                      <button
                        onClick={() => setDateFilterType("created")}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                          dateFilterType === "created"
                            ? "bg-white text-[#D35400] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Ngày đặt đơn
                      </button>
                    </div>
                  </div>

                  {/* Date Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">Từ ngày</label>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-800 outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1">Đến ngày</label>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="bg-transparent text-xs font-bold text-gray-800 outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <button
                      onClick={handleClearDateFilters}
                      disabled={!hasActiveDateFilter}
                      className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-40 transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                    <button
                      onClick={() => setShowDateFilterDropdown(false)}
                      className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tổng đơn
                </p>
                <p className="text-lg font-black text-gray-900">{totalCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Đang xử lý
                </p>
                <p className="text-lg font-black text-amber-600">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Hoàn thành
                </p>
                <p className="text-lg font-black text-emerald-600">{completedCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#D35400] shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Đã tiêu tích lũy
                </p>
                <p className="text-base font-black text-[#D35400] flex items-center gap-1">
                  {new Intl.NumberFormat("vi-VN").format(totalSpentPoints)}
                  <Image
                    src="/logo_point.png"
                    alt="coin"
                    width={14}
                    height={14}
                    className="object-contain"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const count = getTabCount(tab.status);
              const isActive = activeTab === tab.status;
              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.status)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-[#D35400] text-white shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-orange-200 hover:text-[#D35400]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse p-6"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-xs p-6">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy đơn hàng nào</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {fromDate || toDate
                  ? "Không tìm thấy đơn hàng phù hợp với khoảng thời gian đã chọn."
                  : activeTab !== null
                    ? `Không có đơn hàng nào thuộc trạng thái "${ORDER_STATUS_META[activeTab]?.label}".`
                    : "Bạn chưa có đơn hàng nào trong hệ thống."}
              </p>
              <Link
                href={ROUTES.SESSION}
                className="inline-flex items-center px-6 py-3 bg-[#D35400] text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-md"
              >
                Đặt món ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => {
                const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-200 group cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    {/* Header of Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className="text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        {order.sessionName && (
                          <span className="text-xs font-semibold text-orange-900 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <span>🍱</span> {order.sessionName}
                          </span>
                        )}
                        {refundMap[order.id] !== undefined && (
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1"
                            style={{
                              background:
                                REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.bg ||
                                "#fef2f2",
                              color:
                                REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.color ||
                                "#ef4444",
                            }}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.label}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.createdAtUtc)}
                      </span>
                    </div>

                    {/* Body of Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-gray-100"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900 group-hover:text-[#D35400] transition-colors">
                            {order.itemCount} món ăn
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-gray-500 font-medium">
                              Tổng thanh toán:
                            </span>
                            <span className="text-base font-extrabold text-[#D35400] flex items-center gap-1">
                              {new Intl.NumberFormat("vi-VN").format(order.totalPrice)}
                              <Image
                                src="/logo_point.png"
                                alt="coin"
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 justify-end sm:justify-start">
                        {refundMap[order.id] === undefined && order.status === 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${ROUTES.REFUND}?orderId=${order.id}`);
                            }}
                            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-xs"
                          >
                            Yêu cầu hoàn tiền
                          </button>
                        )}
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-600 group-hover:text-[#D35400] bg-gray-50 group-hover:bg-orange-50 border border-gray-200 group-hover:border-orange-200 px-3.5 py-2 rounded-xl transition-all">
                          <span>Chi tiết</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
