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
import { useToast } from "@/lib/hooks/use-toast";

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

export default function ManagerOrdersPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [detailsMap, setDetailsMap] = useState<Map<string, EnrichedOrderDetail>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isHoveredOrDragging = useRef(false);
  const scrollDirection = useRef(1);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

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
        const params: {
          pageSize: number;
          pageNumber: number;
          status?: OrderStatus;
        } = { pageSize, pageNumber: page };
        if (status !== "all") params.status = Number(status) as OrderStatus;

        const data = await orderService.getManagerOrdersBySession(sessionId, params);
        const items = (data.items || []) as unknown as (OrderListItem & { userName?: string })[];
        setTotalCount(data.totalCount || 0);

        const results = await Promise.allSettled(
          items.map((o) =>
            orderService.getOrderById(o.id).then((res) => res as unknown as EnrichedOrderDetail),
          ),
        );

        const map = new Map<string, EnrichedOrderDetail>();
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            map.set(items[i].id, r.value as EnrichedOrderDetail);
          }
        });
        setDetailsMap(map);
      } catch {
        setTotalCount(0);
        toast({ title: "Lỗi", description: "Không thể tải danh sách đơn hàng." });
      } finally {
        setLoadingOrders(false);
      }
    },
    [pageSize, toast],
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
    if (result.length === 0 && !loadingOrders && detailsMap.size === 0) {
      return [];
    }
    return result;
  }, [detailsMap, loadingOrders]);

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

  const totalPages = Math.ceil(totalCount / pageSize);

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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Đơn Hàng</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Theo dõi và quản lý đơn hàng theo từng ca phục vụ
        </p>
      </div>

      {/* Session selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block">
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
                    "shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-sm border-2 transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 border-gray-200 shadow-2xs",
                  )}
                >
                  <Coffee
                    className={cn("w-4 h-4", isSelected ? "text-[#D35400]" : "text-gray-400")}
                  />
                  <span>{s.name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500",
                    )}
                  >
                    {s.dishes?.length ?? 0}
                  </span>
                  {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Tổng đơn
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl font-extrabold text-gray-900">{stats.total}</span>
                <span className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400]">
                  <ShoppingBag className="w-6 h-6" />
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Hoàn thành
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl font-extrabold text-gray-900">{stats.completed}</span>
                <span className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Đã hủy</div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl font-extrabold text-gray-900">{stats.cancelled}</span>
                <span className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Ban className="w-6 h-6" />
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Doanh thu
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  <span className="inline-flex items-center gap-0.5">
                    <span>{stats.revenue.toLocaleString()}</span>
                    <Image
                      src="/logo_point.png"
                      alt="P"
                      width={16}
                      height={16}
                      className="align-middle"
                    />
                  </span>
                </span>
                <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <DollarSign className="w-6 h-6" />
                </span>
              </div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="bg-white p-6 border border-gray-200 rounded-2xl flex flex-col sm:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên hoặc user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 text-gray-900 font-medium"
              />
            </div>
            <div className="w-full sm:w-auto flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-base bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 outline-none font-bold focus:ring-2 focus:ring-[#D35400]/20"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchOrdersWithDetails(selectedSessionId, currentPage, statusFilter)}
                disabled={loadingOrders}
                className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shrink-0"
                title="Làm mới"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-500 ${loadingOrders ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Order cards */}
          {loadingOrders && detailsMap.size === 0 ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
              <p className="text-base font-bold text-gray-500">Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs flex flex-col items-center justify-center gap-3">
              <Package className="w-12 h-12 text-gray-300" />
              <p className="text-gray-400 font-bold text-lg">Không tìm thấy đơn hàng nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                const detail = detailsMap.get(order.id);
                const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META[0];
                const userName =
                  detail?.userName ||
                  (order as OrderListItem & { userName?: string }).userName ||
                  order.userId.slice(0, 12);
                const userImgUrl = detail?.userImgUrl || null;
                const items = detail?.items || [];
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-gray-200/30 p-6 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 flex flex-col justify-between shadow-2xs gap-4 card-3d"
                  >
                    <div className="space-y-3.5">
                      {/* User + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shrink-0 overflow-hidden">
                            {userImgUrl ? (
                              <Image
                                src={userImgUrl}
                                alt={userName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                            <p className="text-xs font-mono font-bold text-gray-400 truncate">
                              #{order.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0",
                            meta.bg,
                          )}
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>

                      {/* Items full list with price */}
                      {items.length > 0 && (
                        <div className="space-y-0 divide-y divide-gray-50">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 py-2">
                              {item.imgUrl ? (
                                <Image
                                  src={item.imgUrl}
                                  alt={item.dishName || "Món"}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-100"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#D35400] text-xs font-bold shrink-0">
                                  {(item.dishName || "?").charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-700 truncate">
                                  {item.dishName || "Món ăn"}
                                </p>
                              </div>
                              <span className="text-[11px] font-bold text-gray-400 shrink-0">
                                x{item.quantity}
                              </span>
                              <span className="text-[11px] font-bold text-[#D35400] shrink-0 inline-flex items-center gap-0.5">
                                <span>{(item.unitPrice || 0).toLocaleString()}</span>
                                <Image
                                  src="/logo_point.png"
                                  alt="P"
                                  width={10}
                                  height={10}
                                  className="align-middle"
                                />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Divider + total + time */}
                      <div className="pt-2.5 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold">Thời gian</span>
                          <span className="font-bold text-gray-500">
                            {new Date(order.createdAtUtc).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            {new Date(order.createdAtUtc).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-400">Tổng cộng</span>
                          <span className="text-base font-bold text-[#D35400] inline-flex items-center gap-0.5">
                            <span>{order.totalPrice.toLocaleString()}</span>
                            <Image
                              src="/logo_point.png"
                              alt="coin"
                              width={12}
                              height={12}
                              className="align-middle"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-bold text-gray-500">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
