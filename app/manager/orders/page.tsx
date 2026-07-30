"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Search,
  ShoppingBag,
  Ban,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
  RefreshCw,
  Package,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import type { OrderListItem, OrderDetail, OrderStatus } from "@/types/order.types";
import { ORDER_STATUS_META } from "@/types/order.types";

interface EnrichedOrderDetail extends OrderDetail {
  userName?: string;
  userImgUrl?: string | null;
}

const STATUS_FILTER_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ xử lý", value: "0" },
  { label: "Sẵn sàng nhận", value: "1" },
  { label: "Hoàn thành", value: "2" },
  { label: "Đã hủy", value: "3" },
  { label: "Đang chuẩn bị", value: "4" },
  { label: "Hết hạn", value: "7" },
] as const;

function getPageNumbers(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function ManagerOrdersPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [detailsMap, setDetailsMap] = useState<Map<string, EnrichedOrderDetail>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isHoveredOrDragging = useRef(false);
  const scrollDirection = useRef(1);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  const totalPages = Math.ceil(totalCount / pageSize);

  const sortedSessions = useMemo(() => {
    const now = new Date();
    return [...sessions].sort((a, b) => {
      const aLive = a.isActive && (!a.availableTo || new Date(a.availableTo) > now);
      const bLive = b.isActive && (!b.availableTo || new Date(b.availableTo) > now);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return 0;
    });
  }, [sessions]);

  useEffect(() => {
    sessionService
      .getSessions({ pageSize: 100 })
      .then((result) => {
        setSessions(result.items);
        const activeSession = result.items.find(
          (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
        );
        if (activeSession) setSelectedSessionId(activeSession.id);
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    if (loadingSessions || sortedSessions.length === 0) return;
    const initAutoScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;
      const scrollSpeed = 0.5;
      const scrollLoop = () => {
        if (!isHoveredOrDragging.current && container) {
          const maxScrollLeft = container.scrollWidth - container.clientWidth;
          if (maxScrollLeft <= 0) return;
          if (container.scrollLeft >= maxScrollLeft - 1 && scrollDirection.current === 1) {
            scrollDirection.current = -1;
          } else if (container.scrollLeft <= 0 && scrollDirection.current === -1) {
            scrollDirection.current = 1;
          }
          container.scrollLeft += scrollSpeed * scrollDirection.current;
        }
        animationRef.current = requestAnimationFrame(scrollLoop);
      };
      animationRef.current = requestAnimationFrame(scrollLoop);
    };
    const timerId = setTimeout(initAutoScroll, 300);
    return () => {
      clearTimeout(timerId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loadingSessions, sortedSessions]);

  const handleMouseEnterTabs = () => {
    isHoveredOrDragging.current = true;
  };
  const handleMouseLeaveTabs = () => {
    if (!isDown.current) isHoveredOrDragging.current = false;
  };
  const handleMouseDownTabs = (e: React.MouseEvent) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    isDown.current = true;
    isHoveredOrDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeftState.current = container.scrollLeft;
  };
  const handleMouseMoveTabs = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    const container = tabsContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    container.scrollLeft = scrollLeftState.current - (x - startX.current) * 1.8;
  };
  const handleMouseUpTabs = () => {
    isDown.current = false;
    isHoveredOrDragging.current = false;
  };

  const fetchOrdersWithDetails = useCallback(
    async (sessionId: string, page: number, status: string) => {
      setLoadingOrders(true);
      setDetailsMap(new Map());
      try {
        const params: { pageSize: number; pageNumber: number; status?: OrderStatus } = {
          pageSize,
          pageNumber: page,
        };
        if (status !== "all") params.status = Number(status) as OrderStatus;

        const data = await orderService.getManagerOrdersBySession(sessionId, params);
        const items = (data?.items || []) as unknown as (OrderListItem & { userName?: string })[];
        setTotalCount(data?.totalCount || 0);

        const results = await Promise.allSettled(
          items.map((o) =>
            orderService
              .getManagerOrderById(o.id)
              .catch(() => orderService.getOrderById(o.id))
              .catch(() => o as unknown as EnrichedOrderDetail),
          ),
        );

        const map = new Map<string, EnrichedOrderDetail>();
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) {
            map.set(items[i].id, r.value as EnrichedOrderDetail);
          } else {
            map.set(items[i].id, items[i] as unknown as EnrichedOrderDetail);
          }
        });
        setDetailsMap(map);
      } catch {
        setTotalCount(0);
      } finally {
        setLoadingOrders(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (!selectedSessionId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrdersWithDetails(selectedSessionId, currentPage, statusFilter);
  }, [selectedSessionId, currentPage, statusFilter, fetchOrdersWithDetails]);

  const orders = useMemo(() => {
    const result: (OrderListItem & { detail?: OrderDetail })[] = [];
    detailsMap.forEach((detail, id) => {
      result.push({ ...detail, id });
    });
    return result;
  }, [detailsMap]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) => {
      const detail = detailsMap.get(o.id);
      const userName = detail?.userName || "";
      return (
        o.id.toLowerCase().includes(q) ||
        o.userId.toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, detailsMap]);

  const stats = useMemo(() => {
    const allDetails = Array.from(detailsMap.values());
    const total = allDetails.length;
    const completed = allDetails.filter((o) => o.status === 2).length;
    const cancelled = allDetails.filter((o) => o.status === 3).length;
    const revenue = allDetails
      .filter((o) => o.status === 2)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    return { total, completed, cancelled, revenue };
  }, [detailsMap]);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const firstItemIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItemIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Đơn Hàng</h1>
        <p className="text-base text-gray-500 mt-0.5">
          Theo dõi và quản lý đơn hàng theo từng ca phục vụ
        </p>
      </div>

      {/* Session selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <label className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4 block">
          Chọn ca phục vụ
        </label>
        {loadingSessions ? (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#D35400]" />
            <span className="text-sm text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <div
            ref={tabsContainerRef}
            onMouseEnter={handleMouseEnterTabs}
            onMouseLeave={handleMouseLeaveTabs}
            onMouseDown={handleMouseDownTabs}
            onMouseMove={handleMouseMoveTabs}
            onMouseUp={handleMouseUpTabs}
            className="flex gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing cursor-grab"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sortedSessions.map((s) => {
              const isLive = s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date());
              const isSelected = s.id === selectedSessionId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (!isDown.current) {
                      setSelectedSessionId(s.id);
                      setCurrentPage(1);
                    }
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-xl font-black text-base border-2 transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-orange-400 text-black border-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 border-gray-200 shadow-2xs",
                  )}
                >
                  <Coffee className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-400")} />
                  <span>{s.name}</span>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-md",
                      isSelected ? "bg-white text-black" : "bg-gray-200 text-gray-500",
                    )}
                  >
                    {s.dishes?.length ?? 0}
                  </span>
                  {isLive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedSessionId && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-orange-50/60 rounded-2xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tổng đơn</p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-[#D35400] shrink-0">
                <ShoppingBag className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Hoàn thành
                </p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-red-50/60 rounded-2xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Đã hủy</p>
                <p className="text-4xl font-extrabold text-gray-900">{stats.cancelled}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Ban className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Doanh thu
                </p>
                <p className="text-4xl font-extrabold text-gray-900 inline-flex items-center gap-0.5">
                  <span>{stats.revenue.toLocaleString()}</span>
                  <Image
                    src="/logo_point.png"
                    alt="P"
                    width={18}
                    height={18}
                    className="align-middle"
                  />
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên hoặc user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200/80 bg-gray-50/80 pl-14 pr-5 text-base font-semibold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:bg-white focus:ring-2 focus:ring-[#D35400]/15 placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-14 rounded-2xl border border-gray-200/80 bg-white px-5 text-base font-bold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15 w-full lg:w-56"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    fetchOrdersWithDetails(selectedSessionId, currentPage, statusFilter)
                  }
                  disabled={loadingOrders}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-gray-500 transition-all hover:bg-[#D35400]/5 hover:text-[#D35400] shrink-0"
                >
                  <RefreshCw className={`w-6 h-6 ${loadingOrders ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Order table */}
          {loadingOrders && detailsMap.size === 0 ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#D35400]/20 border-t-[#D35400]" />
              </div>
              <p className="text-base font-bold text-gray-500">Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-bold text-gray-400">Không tìm thấy đơn hàng nào.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="border-b border-gray-100 bg-gray-50/70">
                    <tr>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-16">
                        #
                      </th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400">
                        Khách hàng
                      </th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400">
                        Món ăn
                      </th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-32">
                        Tổng tiền
                      </th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-36">
                        Trạng thái
                      </th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-wider text-gray-400 w-32">
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {filteredOrders.map((order, idx) => {
                      const detail = detailsMap.get(order.id);
                      const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META[0];
                      const userName =
                        detail?.userName ||
                        (order as OrderListItem & { userName?: string }).userName ||
                        order.userId.slice(0, 12);
                      const userImgUrl = detail?.userImgUrl || null;
                      const items = detail?.items || [];
                      return (
                        <tr
                          key={order.id}
                          className="transition-all duration-200 hover:bg-orange-50/30 animate-fade-in"
                          style={{ animationDelay: `${idx * 40}ms` } as React.CSSProperties}
                        >
                          <td className="px-8 py-5">
                            <span className="font-mono text-sm font-bold text-[#D35400]">
                              #{order.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shrink-0 overflow-hidden">
                                {userImgUrl ? (
                                  <Image
                                    src={userImgUrl}
                                    alt={userName}
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold text-gray-900 truncate max-w-[180px]">
                                  {userName}
                                </p>
                                <p className="text-xs text-gray-400 font-mono truncate">
                                  {order.userId.slice(0, 12)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {items.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {items.slice(0, 3).map((item, i) => (
                                  <span key={i} className="text-sm text-gray-600 font-medium">
                                    {item.dishName || "Món ăn"} x{item.quantity}
                                  </span>
                                ))}
                                {items.length > 3 && (
                                  <span className="text-sm font-bold text-gray-400">
                                    +{items.length - 3} món khác
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-base font-black text-[#D35400]">
                              {order.totalPrice.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className="inline-flex px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
                              style={{ color: meta.color, backgroundColor: meta.bg }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-semibold text-gray-500 whitespace-nowrap">
                            {new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            {new Date(order.createdAtUtc).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-4 border-t border-gray-100 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-semibold text-gray-500">
                    Hiển thị{" "}
                    <span className="font-black text-gray-800">
                      {firstItemIndex}-{lastItemIndex}
                    </span>{" "}
                    trong <span className="font-black text-gray-800">{totalCount}</span> đơn hàng
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loadingOrders}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {pageNumbers[0] > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="hidden h-11 min-w-11 rounded-xl border border-gray-200 px-4 text-base font-black text-gray-600 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] sm:inline-flex sm:items-center sm:justify-center"
                        >
                          1
                        </button>
                        <span className="hidden px-1 text-base font-black text-gray-400 sm:inline">
                          ...
                        </span>
                      </>
                    )}
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={loadingOrders}
                        className={cn(
                          "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-4 text-base font-black transition-all disabled:cursor-not-allowed disabled:opacity-50",
                          page === currentPage
                            ? "border-[#D35400] bg-[#D35400] text-white shadow-md shadow-orange-500/25"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400]",
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    {pageNumbers[pageNumbers.length - 1] < totalPages && (
                      <>
                        <span className="hidden px-1 text-base font-black text-gray-400 sm:inline">
                          ...
                        </span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="hidden h-11 min-w-11 rounded-xl border border-gray-200 px-4 text-base font-black text-gray-600 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] sm:inline-flex sm:items-center sm:justify-center"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loadingOrders}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
