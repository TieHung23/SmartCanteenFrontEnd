"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Cpu,
  RefreshCw,
  Coffee,
  ShoppingBag,
  Eye,
  History,
  Loader2,
  Calendar,
  Layers,
  Package,
  Route,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import { cn, getSafeUserAvatar } from "@/lib/utils";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import { robotArmService } from "@/services/robot-arm.service";
import { trayService } from "@/services/tray.service";
import { pickupSlotService } from "@/services/pickup-slot.service";
import { slotConfigurationService } from "@/services/slot-configuration.service";

import type { OrderListItem, OrderDetail } from "@/types/order.types";
import { ORDER_STATUS_META, ORDER_ITEM_STATUS_META } from "@/types/order.types";
import type { RobotArm } from "@/types/robot-arm.types";
import type { SessionListItem } from "@/types/session.types";
import type { TrayPoolSummary } from "@/types/tray.types";
import type { PickupSlotSummary } from "@/types/pickup-slot.types";
import type { SlotConfiguration } from "@/types/slot-configuration.types";

import Modal from "../manager/_components/modal";

interface EnrichedOrderDetail extends OrderDetail {
  userName?: string;
  userImgUrl?: string | null;
}

export default function StaffOperationsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [robotArms, setRobotArms] = useState<RobotArm[]>([]);
  const [traysPool, setTraysPool] = useState<TrayPoolSummary | null>(null);
  const [slotsPool, setSlotsPool] = useState<PickupSlotSummary | null>(null);
  const [laneConfigs, setLaneConfigs] = useState<SlotConfiguration[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Map<string, EnrichedOrderDetail>>(new Map());

  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Detail Modal States (Read-only view)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<EnrichedOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Session Search & Auto-scroll states
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isHoveredOrDragging = useRef(false);
  const scrollDirection = useRef(1);
  const isDown = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const sessionButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const selectAndScrollToSession = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    isHoveredOrDragging.current = true;

    setTimeout(() => {
      const btn = sessionButtonRefs.current.get(sessionId);
      if (btn) {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 50);
  }, []);

  const filteredSessionsBySearch = useMemo(() => {
    const q = sessionSearchQuery.toLowerCase().trim();
    if (!q) return [];
    return sessions.filter((s) => s.name.toLowerCase().includes(q));
  }, [sessions, sessionSearchQuery]);

  const handleSessionSearch = (query: string) => {
    setSessionSearchQuery(query);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const match = sessions.find((s) => s.name.toLowerCase().includes(q));
      if (match) {
        selectAndScrollToSession(match.id);
      }
    }
  };

  useEffect(() => {
    if (loading || sessions.length === 0 || !isAutoScrollEnabled) return;
    const initAutoScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;
      const scrollSpeed = 0.5;
      const scrollLoop = () => {
        if (!isHoveredOrDragging.current && !sessionSearchQuery.trim() && container) {
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
  }, [loading, sessions, isAutoScrollEnabled, sessionSearchQuery]);

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
    hasDragged.current = false;
    isHoveredOrDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeftState.current = container.scrollLeft;
  };
  const handleMouseMoveTabs = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    const container = tabsContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.8;
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
      e.preventDefault();
      container.scrollLeft = scrollLeftState.current - walk;
    }
  };
  const handleMouseUpTabs = () => {
    isDown.current = false;
    isHoveredOrDragging.current = false;
  };

  // Fetch Operations Overview (Hardware & Sessions)
  const fetchOperationsOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, armsRes, traysData, slotsData] = await Promise.all([
        sessionService.getSessions({ pageSize: 50 }).catch(() => ({ items: [] })),
        robotArmService.getList().catch(() => []),
        trayService.getPool().catch(() => null),
        pickupSlotService.getList().catch(() => null),
      ]);

      const items = sessionsRes?.items || [];
      setSessions(items);
      setRobotArms(armsRes || []);
      setTraysPool(traysData);
      setSlotsPool(slotsData);

      const activeSession = items.find(
        (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
      );
      if (activeSession && !selectedSessionId) {
        setSelectedSessionId(activeSession.id);
      } else if (items.length > 0 && !selectedSessionId) {
        setSelectedSessionId(items[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  // Fetch orders & lane configs for selected session
  const fetchSessionOrdersAndLanes = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    setLoadingOrders(true);
    try {
      const [data, configs] = await Promise.all([
        orderService.getManagerOrdersBySession(sessionId, { pageSize: 50 }),
        slotConfigurationService.getBySession(sessionId).catch(() => []),
      ]);

      setLaneConfigs(configs || []);
      const items = (data?.items || []) as OrderListItem[];
      setOrders(items);

      // Fetch details for each order
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
      setOrders([]);
      setLaneConfigs([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOperationsOverview();
  }, [fetchOperationsOverview]);

  useEffect(() => {
    if (selectedSessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSessionOrdersAndLanes(selectedSessionId);
    }
  }, [selectedSessionId, fetchSessionOrdersAndLanes]);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId],
  );

  const openDetailModal = async (orderId: string, existingDetail?: EnrichedOrderDetail) => {
    if (existingDetail && existingDetail.items && existingDetail.items.length > 0) {
      setSelectedDetail(existingDetail);
      setIsDetailOpen(true);
    } else {
      setLoadingDetail(true);
      setIsDetailOpen(true);
      try {
        const detail = await orderService.getManagerOrderById(orderId);
        setSelectedDetail(detail as EnrichedOrderDetail);
      } catch {
        if (existingDetail) setSelectedDetail(existingDetail);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* ── HEADER ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Trung Tâm Điều Hành</h1>
          <p className="text-base text-gray-500 mt-1">
            Giám sát thời gian thực thiết bị Robot, Khay đồ, Ô kệ nhận hàng và danh sách đơn hàng
          </p>
        </div>
        <button
          onClick={() => {
            fetchOperationsOverview();
            if (selectedSessionId) fetchSessionOrdersAndLanes(selectedSessionId);
          }}
          disabled={loading || loadingOrders}
          className="inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base px-6 py-3.5 rounded-2xl shadow-xs transition-all shrink-0 self-start md:self-auto active:scale-95"
        >
          <RefreshCw className={cn("w-5 h-5", loading || loadingOrders ? "animate-spin" : "")} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* ── HARDWARE & HARDWARE POOL METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Khay đồ (Trays) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Khay Đồ (Trays Pool)</span>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100/60">
              <Layers className="w-5.5 h-5.5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {traysPool?.trays?.length ??
              (traysPool ? traysPool.available + traysPool.reserved + traysPool.inUse : "—")}{" "}
            <span className="text-base font-bold text-gray-400">khay</span>
          </p>
          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-100">
            <span className="text-emerald-600">✓ Sẵn sàng: {traysPool?.available ?? 0}</span>
            <span className="text-blue-600">⚙ Đang dùng: {traysPool?.inUse ?? 0}</span>
          </div>
        </div>

        {/* Ô nhận hàng (Pickup Slots) */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Ô Kệ Nhận Hàng</span>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/60">
              <Package className="w-5.5 h-5.5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {slotsPool?.slots?.length ?? (slotsPool ? slotsPool.empty + slotsPool.occupied : "—")}{" "}
            <span className="text-base font-bold text-gray-400">ô</span>
          </p>
          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-100">
            <span className="text-emerald-600">✓ Trống: {slotsPool?.empty ?? 0}</span>
            <span className="text-amber-600">📦 Có hàng: {slotsPool?.occupied ?? 0}</span>
          </div>
        </div>

        {/* Lane Robot trong ca */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Lane Robot Trong Ca</span>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100/60">
              <Route className="w-5.5 h-5.5" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-700">
            {laneConfigs.length} <span className="text-base font-bold text-gray-400">lanes</span>
          </p>
          <p className="text-xs text-gray-500 font-bold truncate pt-1 border-t border-gray-100">
            {laneConfigs.length > 0
              ? `Lane active: ${laneConfigs
                  .map((c) => c.laneCode)
                  .slice(0, 3)
                  .join(", ")}`
              : "Chưa cấu hình lane trong ca"}
          </p>
        </div>

        {/* Cánh tay Robot */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Cánh Tay Robot</span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/60">
              <Cpu className="w-5.5 h-5.5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">
            {robotArms.length} <span className="text-base font-bold text-gray-400">robot</span>
          </p>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 pt-1 border-t border-gray-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tất cả máy hoạt động tốt
          </p>
        </div>
      </div>

      {/* ── SECTION: CHI TIẾT LANE ROBOT VÀ CÁNH TAY ROBOT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Cấu hình Lane Robot trong ca */}
        <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Route className="w-6 h-6 text-purple-600" />
            Cấu Hình Lane Robot ({laneConfigs.length})
          </h2>

          {laneConfigs.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 font-bold text-sm">
              Ca ăn này chưa được cấu hình lane robot.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {laneConfigs.map((cfg) => {
                const dish = currentSession?.dishes?.find(
                  (d) => d.dishId === cfg.dishId || d.id === cfg.dishId,
                );
                const arm = robotArms.find((a) => a.id === cfg.robotArmId);
                return (
                  <div
                    key={cfg.id}
                    className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900 font-mono">
                        Lane {cfg.laneCode}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                        Sức chứa: {cfg.capacity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-bold truncate">
                      Món gán: {dish?.dishName || cfg.dishId?.slice(0, 8) || "—"}
                    </p>
                    {arm && (
                      <p className="text-[11px] font-mono text-gray-400">
                        Robot: {arm.code || arm.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Box 2: Cánh tay Robot Status */}
        <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-[#D35400]" />
            Cánh Tay Robot Trạm Phục Vụ ({robotArms.length})
          </h2>

          {robotArms.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 font-bold text-sm">
              Hiện không có robot nào trong hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {robotArms.map((bot) => {
                const statusMap: Record<string, { label: string; className: string }> = {
                  Idle: { label: "Sẵn sàng", className: "bg-green-100 text-green-800" },
                  Busy: { label: "Đang gắp món", className: "bg-amber-100 text-amber-800" },
                  Error: { label: "Gặp sự cố", className: "bg-red-100 text-red-800" },
                  Maintenance: { label: "Bảo trì", className: "bg-gray-100 text-gray-700" },
                  Offline: { label: "Ngoại tuyến", className: "bg-red-100 text-red-800" },
                };
                const statusInfo = statusMap[bot.status] || {
                  label: bot.status || "Ngoại tuyến",
                  className: "bg-red-100 text-red-800",
                };
                return (
                  <div
                    key={bot.id}
                    className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900 truncate">
                        {bot.name || bot.code}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                          statusInfo.className,
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Mã: <span className="font-mono font-bold text-gray-800">{bot.code}</span> ·
                      Trạm: <span className="font-bold text-gray-800">#{bot.stationIndex}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 3: PHIÊN PHỤC VỤ & BẢNG ĐƠN HÀNG LỚN ĐỒNG NHẤT ── */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-[#D35400]" />
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                Chọn Ca Phục Vụ Cần Giám Sát
              </label>
              {sessions.length > 0 && (
                <span className="text-xs font-extrabold text-[#D35400] bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {sessions.length} ca
                </span>
              )}
            </div>

            {/* Search Input & Auto-scroll Control */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={sessionSearchQuery}
                  onChange={(e) => handleSessionSearch(e.target.value)}
                  placeholder="Tìm nhanh ca phục vụ..."
                  className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#D35400] focus:bg-white transition-all placeholder:text-gray-400"
                />
                {sessionSearchQuery && (
                  <button
                    onClick={() => handleSessionSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-200/50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Toggle Auto Scroll Button */}
              <button
                onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isAutoScrollEnabled
                    ? "bg-orange-50 border-orange-200 text-[#D35400]"
                    : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200",
                )}
                title={
                  isAutoScrollEnabled ? "Tạm dừng băng chuyền cuộn tự động" : "Bật cuộn tự động"
                }
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isAutoScrollEnabled && "animate-spin")} />
                <span className="hidden sm:inline">
                  {isAutoScrollEnabled ? "Tự cuộn: Bật" : "Tự cuộn: Tắt"}
                </span>
              </button>
            </div>
          </div>

          {/* Search Suggestion Chips */}
          {sessionSearchQuery.trim() && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs animate-in fade-in">
              <span className="text-gray-400 font-bold shrink-0">Kết quả tìm thấy:</span>
              {filteredSessionsBySearch.length === 0 ? (
                <span className="text-red-500 font-semibold italic">Không tìm thấy ca phù hợp</span>
              ) : (
                filteredSessionsBySearch.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectAndScrollToSession(s.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5 text-xs",
                      s.id === selectedSessionId
                        ? "bg-[#D35400] text-white border-[#D35400] shadow-xs"
                        : "bg-orange-50 hover:bg-orange-100 text-orange-950 border-orange-200",
                    )}
                  >
                    <span>🎯</span>
                    <span>{s.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          <div
            ref={tabsContainerRef}
            onMouseEnter={handleMouseEnterTabs}
            onMouseLeave={handleMouseLeaveTabs}
            onMouseDown={handleMouseDownTabs}
            onMouseMove={handleMouseMoveTabs}
            onMouseUp={handleMouseUpTabs}
            className="flex gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing cursor-grab scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sessions.map((s) => {
              const isLive = s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date());
              const isSelected = s.id === selectedSessionId;
              const isMatchedBySearch =
                sessionSearchQuery.trim() &&
                s.name.toLowerCase().includes(sessionSearchQuery.toLowerCase().trim());

              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    if (el) sessionButtonRefs.current.set(s.id, el);
                  }}
                  onClick={() => {
                    if (!hasDragged.current) {
                      selectAndScrollToSession(s.id);
                    }
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-sm border-2 transition-all whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#D35400] text-white border-[#B04600] shadow-md scale-102"
                      : isMatchedBySearch
                        ? "bg-orange-100 text-orange-950 border-orange-400 ring-2 ring-orange-300/50"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 shadow-2xs",
                  )}
                >
                  <Coffee className={cn("w-4 h-4", isSelected ? "text-white" : "text-gray-400")} />
                  <span>{s.name}</span>
                  {isLive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {currentSession && (
            <div className="p-6 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white rounded-2xl border border-orange-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[#D35400]" />
                  {currentSession.name}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {currentSession.description || "Phiên phục vụ bữa ăn Smart Canteen."}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-600 shrink-0">
                <span className="bg-white px-4 py-2 rounded-xl border border-orange-200 text-[#D35400] font-black text-sm">
                  Thực đơn: {currentSession.dishes?.length || 0} món
                </span>
                <span
                  className={cn(
                    "px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs",
                    currentSession.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  {currentSession.isActive ? "Đang hoạt động" : "Đã đóng"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Full-size Order Table */}
        <div className="bg-white border border-gray-100 rounded-3xl p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-[#D35400]" />
              Danh Sách Đơn Hàng Trong Phiên ({orders.length})
            </h3>
          </div>

          {loadingOrders ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#D35400]" />
              <p className="text-base font-bold text-gray-500">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-16 text-center text-gray-400 font-bold text-base">
              Phiên phục vụ này hiện chưa có đơn hàng nào.
            </div>
          ) : (
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/90 border-b border-gray-200 text-sm font-black uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="py-4 px-6 w-28">Mã đơn</th>
                    <th className="py-4 px-6">Khách hàng</th>
                    <th className="py-4 px-6">Món ăn</th>
                    <th className="py-4 px-6 text-right w-36">Tổng tiền</th>
                    <th className="py-4 px-6 w-44">Trạng thái</th>
                    <th className="py-4 px-6 w-36">Thời gian</th>
                    <th className="py-4 px-6 text-center w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const detail = detailsMap.get(order.id);
                    const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META[0];
                    const userName =
                      detail?.name ||
                      detail?.userName ||
                      (order as OrderListItem & { userName?: string }).userName ||
                      order.userId.slice(0, 12);
                    const userImgUrl = getSafeUserAvatar(
                      detail?.imgUrl || detail?.userImgUrl,
                      order.userId || userName,
                    );
                    const items = detail?.items || [];

                    return (
                      <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-4 px-6 font-mono font-black text-base text-[#D35400]">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                              <Image
                                src={userImgUrl}
                                alt={userName}
                                width={44}
                                height={44}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-base text-gray-900 truncate max-w-[180px]">
                                {userName}
                              </p>
                              <p className="text-xs font-mono text-gray-400">
                                {order.userId.slice(0, 12)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {items.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {items.slice(0, 2).map((item, i) => (
                                <span key={i} className="text-sm font-semibold text-gray-700">
                                  {item.dishName || "Món ăn"} x{item.quantity}
                                </span>
                              ))}
                              {items.length > 2 && (
                                <span className="text-xs font-bold text-gray-400">
                                  +{items.length - 2} món khác
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-base text-[#D35400]">
                          <span className="inline-flex items-center gap-1">
                            {order.totalPrice.toLocaleString()}
                            <div className="relative w-4 h-4 opacity-95">
                              <Image
                                src="/logo_point.png"
                                alt="P"
                                fill
                                sizes="16px"
                                className="object-contain filter brightness-110"
                              />
                            </div>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider inline-block shadow-2xs"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-bold whitespace-nowrap">
                          {new Date(order.createdAtUtc).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => openDetailModal(order.id, detail)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#D35400] hover:bg-[#D35400] hover:text-white transition-all shadow-2xs"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── ORDER DETAIL READ-ONLY MODAL ── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Chi tiết đơn hàng #${selectedDetail?.id?.slice(0, 8) || ""}`}
        size="lg"
      >
        {loadingDetail ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#D35400]" />
            <p className="text-base font-bold text-gray-500">Đang tải chi tiết đơn hàng...</p>
          </div>
        ) : selectedDetail ? (
          <div className="space-y-6 text-gray-800">
            {/* Customer Info Header */}
            <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white p-6 rounded-2xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const avatarSrc = getSafeUserAvatar(
                    selectedDetail.imgUrl || selectedDetail.userImgUrl,
                    selectedDetail.userId || selectedDetail.name || selectedDetail.userName,
                  );
                  return (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 shadow-xs shrink-0 overflow-hidden">
                      <Image
                        src={avatarSrc}
                        alt={selectedDetail.name || selectedDetail.userName || "Khách hàng"}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })()}
                <div>
                  <h4 className="text-xl font-black text-gray-900">
                    {selectedDetail.name || selectedDetail.userName || "Khách hàng"}
                  </h4>
                  <p className="text-xs font-mono text-gray-500">
                    User ID: {selectedDetail.userId}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {(() => {
                  const meta = ORDER_STATUS_META[selectedDetail.status] || ORDER_STATUS_META[0];
                  return (
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs"
                      style={{ color: meta.color, backgroundColor: meta.bg }}
                    >
                      {meta.icon} {meta.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-400 font-medium">
                  {selectedDetail.createdAtUtc &&
                    new Date(selectedDetail.createdAtUtc).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Identifiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Mã Đơn (Order ID)
                </p>
                <p className="text-xs font-mono font-bold text-gray-800 mt-1 truncate">
                  {selectedDetail.id}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Mã Giao Dịch (Transaction ID)
                </p>
                <p className="text-xs font-mono font-bold text-gray-800 mt-1 truncate">
                  {selectedDetail.transactionId || "—"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Mã Mẫu Thực Đơn (Meal Template ID)
                </p>
                <p className="text-xs font-mono font-bold text-gray-800 mt-1 truncate">
                  {selectedDetail.mealTemplateId || "—"}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h5 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D35400]" />
                Danh sách món ăn ({selectedDetail.items?.length || 0})
              </h5>
              <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs font-black uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="py-3 px-4">Món ăn</th>
                      <th className="py-3 px-4">Trạng thái món</th>
                      <th className="py-3 px-4 text-center">Đơn giá</th>
                      <th className="py-3 px-4 text-center">Số lượng</th>
                      <th className="py-3 px-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {selectedDetail.items && selectedDetail.items.length > 0 ? (
                      selectedDetail.items.map((item, i) => {
                        const itemMeta =
                          item.itemStatus !== undefined
                            ? ORDER_ITEM_STATUS_META[item.itemStatus]
                            : null;
                        const subtotal = item.unitPrice * item.quantity;
                        return (
                          <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">
                                {item.dishName || `Món ID: ${item.dishId.slice(0, 8)}`}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              {itemMeta ? (
                                <span
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                  style={{ color: itemMeta.color, backgroundColor: itemMeta.bg }}
                                >
                                  {itemMeta.label}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-700">
                              {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-900">
                              x{item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-[#D35400]">
                              {subtotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400 font-bold">
                          Không có thông tin chi tiết món ăn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-black">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-right text-gray-700 uppercase">
                        Tổng thanh toán:
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#D35400] text-base">
                        <span className="inline-flex items-center gap-1">
                          {selectedDetail.totalPrice.toLocaleString()}
                          <div className="relative w-4 h-4 opacity-95">
                            <Image
                              src="/logo_point.png"
                              alt="P"
                              fill
                              sizes="16px"
                              className="object-contain filter brightness-110"
                            />
                          </div>
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status Histories Timeline */}
            {selectedDetail.statusHistories && selectedDetail.statusHistories.length > 0 && (
              <div>
                <h5 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#D35400]" />
                  Lịch sử chuyển trạng thái ({selectedDetail.statusHistories.length})
                </h5>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                  {selectedDetail.statusHistories.map((h, index) => {
                    const fromMeta = ORDER_STATUS_META[h.fromStatus] || ORDER_STATUS_META[0];
                    const toMeta = ORDER_STATUS_META[h.toStatus] || ORDER_STATUS_META[0];
                    return (
                      <div
                        key={h.id || index}
                        className="bg-white rounded-xl p-3 border border-gray-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{ color: fromMeta.color, backgroundColor: fromMeta.bg }}
                            >
                              {fromMeta.label}
                            </span>
                            <span className="text-xs text-gray-400 font-bold">➔</span>
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{ color: toMeta.color, backgroundColor: toMeta.bg }}
                            >
                              {toMeta.label}
                            </span>

                            {h.reasonCode && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-100">
                                {h.reasonCode}
                              </span>
                            )}
                          </div>

                          {h.note && (
                            <p className="text-xs text-gray-600 font-medium italic">
                              &quot;{h.note}&quot;
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-gray-400 font-semibold">
                            {new Date(h.createdAtUtc).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
