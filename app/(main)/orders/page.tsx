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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-7 h-7 text-[#D35400]" />
              <h1 className="text-3xl font-extrabold text-gray-800">Đơn hàng của tôi</h1>
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-150 rounded-2xl shadow-xl p-5 z-50 space-y-4 animate-in fade-in slide-in-from-top-2">
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

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.status)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.status
                    ? "bg-[#D35400] text-white shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-orange-200 hover:text-[#D35400]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl border border-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-500 mb-2">Không có đơn hàng nào</h3>
              <p className="text-sm text-gray-400 mb-6">
                {fromDate || toDate
                  ? "Không tìm thấy đơn hàng phù hợp với khoảng thời gian đã chọn."
                  : activeTab !== null
                    ? `Không có đơn hàng với trạng thái "${ORDER_STATUS_META[activeTab]?.label}".`
                    : "Bạn chưa đặt đơn hàng nào."}
              </p>
              <Link
                href={ROUTES.SESSION}
                className="inline-flex items-center px-6 py-3 bg-[#D35400] text-white font-bold text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)]"
              >
                Chọn phiên ăn
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 hover:shadow-lg hover:border-orange-100/70 transition-all group cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className="text-xs font-black px-3.5 py-1.5 rounded-lg"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            {order.sessionName && (
                              <span className="text-xs font-extrabold text-orange-950 bg-orange-50/90 border border-orange-200/60 px-3 py-1 rounded-lg">
                                🍱 {order.sessionName}
                              </span>
                            )}
                            {refundMap[order.id] !== undefined && (
                              <span
                                className="text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1.5"
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
                            <span className="text-xs text-gray-400 font-semibold">
                              {formatDate(order.createdAtUtc)}
                            </span>
                          </div>
                          <p className="text-base font-extrabold text-gray-800 mt-2.5">
                            {order.itemCount} món •{" "}
                            <span className="inline-flex items-center gap-1 text-[#D35400] font-black text-lg">
                              <span>{new Intl.NumberFormat("vi-VN").format(order.totalPrice)}</span>
                              <Image
                                src="/logo_point.png"
                                alt="coin"
                                width={18}
                                height={18}
                                className="object-contain"
                              />
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {refundMap[order.id] === undefined && order.status === 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${ROUTES.REFUND}?orderId=${order.id}`);
                            }}
                            className="text-xs font-black px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                          >
                            Yêu cầu hoàn tiền
                          </button>
                        )}
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#D35400] transition-colors" />
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
