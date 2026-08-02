"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Route, Coffee, RefreshCw, AlertTriangle, Settings } from "lucide-react";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import { SlotConfigTab } from "../sessions/_components/slot-config-tab";
import { cn } from "@/lib/utils";

export default function SlotConfigsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return new Date(b.availableFrom || 0).getTime() - new Date(a.availableFrom || 0).getTime();
    });
  }, [sessions]);

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const result = await sessionService.getSessions({ pageSize: 100 });
      setSessions(result.items);
      if (result.items.length > 0 && !selectedSessionId) {
        const activeSession = result.items.find(
          (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
        );
        setSelectedSessionId(activeSession?.id || result.items[0].id);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền truy cập chức năng này.");
      } else {
        setError("Không thể tải danh sách ca phục vụ. Vui lòng thử lại.");
      }
      console.error(err);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchSessions();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchSessions]);

  useEffect(() => {
    if (loading || sortedSessions.length === 0) return;
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
  }, [loading, sortedSessions]);

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

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0 animate-float">
            <Route className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Cấu Hình Lane</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Gán món vào lane trên băng chuyền theo từng ca phục vụ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchSessions().finally(() => setLoading(false));
          }}
          className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95 shrink-0"
          title="Làm mới"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* ── Session Conveyor ── */}
      <div className="bg-white border border-gray-100/80 rounded-2xl p-6 shadow-xs">
        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block">
          Chọn ca phục vụ
        </label>
        {loading ? (
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
                    }
                  }}
                  className={cn(
                    "shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl font-black text-sm border-2 transition-all duration-300 whitespace-nowrap",
                    isSelected
                      ? "bg-orange-400 text-black border-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 border-gray-200 shadow-xs",
                  )}
                >
                  <Coffee className={cn("w-4 h-4", isSelected ? "text-black" : "text-gray-400")} />
                  <span>{s.name}</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      isSelected ? "bg-white text-orange-600" : "bg-gray-200 text-gray-500",
                    )}
                  >
                    {s.dishes?.length ?? 0} món
                  </span>
                  {isLive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  {s.isFinalized && (
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                        isSelected ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600",
                      )}
                    >
                      Đã chốt
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-gray-200/60 bg-white shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-base font-bold text-gray-500 text-center max-w-md">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchSessions().finally(() => setLoading(false));
            }}
            className="px-5 py-2.5 bg-[#D35400] text-white text-sm font-bold rounded-xl hover:bg-[#b04600] transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : !selectedSessionId ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Settings className="w-7 h-7 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-400">Chọn ca phục vụ để bắt đầu</p>
            <p className="text-sm text-gray-400 mt-1">Kéo thanh ca phục vụ ở trên để chọn</p>
          </div>
        </div>
      ) : selectedSession ? (
        <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
          <SlotConfigTab sessionId={selectedSessionId} dishes={selectedSession.dishes || []} />
        </div>
      ) : null}
    </div>
  );
}
