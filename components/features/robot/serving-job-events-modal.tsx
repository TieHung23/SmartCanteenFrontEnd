"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Utensils,
  Radio,
  OctagonX,
  RotateCcw,
  Loader2,
  Filter,
} from "lucide-react";
import Modal from "@/app/manager/_components/modal";
import { orderService } from "@/services/order.service";
import { servingJobService } from "@/services/serving-job.service";
import type { ServingJobEvent } from "@/types/serving-job.types";
import { cn } from "@/lib/utils";

interface ServingJobEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
  jobId?: string | null;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: typeof Activity }
> = {
  Connected: {
    label: "Kết nối tay máy",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Radio,
  },
  Disconnected: {
    label: "Mất kết nối",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    icon: Radio,
  },
  JobReceived: {
    label: "Nhận việc",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Activity,
  },
  PickStarted: {
    label: "Bắt đầu gắp",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Utensils,
  },
  PickCompleted: {
    label: "Gắp xong",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
  },
  PlaceCompleted: {
    label: "Đặt lên khay",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  Error: {
    label: "Lỗi",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertCircle,
  },
  Recovered: {
    label: "Đã khắc phục",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    icon: RotateCcw,
  },
  EmergencyStop: {
    label: "Dừng khẩn",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    icon: OctagonX,
  },
};

const FILTER_TYPE_OPTIONS = [
  { value: "", label: "Tất cả sự kiện" },
  { value: "Error", label: "🔴 Chỉ lỗi (Error)" },
  { value: "PlaceCompleted", label: "🟢 Đã đặt lên khay" },
  { value: "PickStarted", label: "🔵 Bắt đầu gắp" },
  { value: "PickCompleted", label: "🔵 Gắp xong" },
  { value: "JobReceived", label: "⚪ Nhận việc" },
  { value: "Recovered", label: "🟢 Khắc phục" },
  { value: "EmergencyStop", label: "🔴 Dừng khẩn" },
];

export default function ServingJobEventsModal({
  isOpen,
  onClose,
  orderId,
  jobId,
}: ServingJobEventsModalProps) {
  const [events, setEvents] = useState<ServingJobEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetOrderId = orderId || jobId;

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !targetOrderId) return;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try new per-order events API first
        const res = await orderService.getOrderEvents(targetOrderId, selectedType || undefined);
        if (isMounted) {
          if (res && (res.events.length > 0 || res.count > 0)) {
            setEvents(res.events || []);
            setTotalCount(res.count || res.events.length || 0);
          } else if (jobId) {
            // Fallback to per-job events API if per-order is empty
            const jobRes = await servingJobService.getEvents(jobId).catch(() => null);
            if (jobRes?.events) {
              setEvents(jobRes.events);
              setTotalCount(jobRes.events.length);
            } else {
              setEvents([]);
              setTotalCount(0);
            }
          } else {
            setEvents([]);
            setTotalCount(0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order events:", err);
        if (jobId) {
          try {
            const jobRes = await servingJobService.getEvents(jobId);
            if (isMounted && jobRes?.events) {
              setEvents(jobRes.events);
              setTotalCount(jobRes.events.length);
              return;
            }
          } catch (jobErr) {
            console.error("Fallback serving job events also failed:", jobErr);
          }
        }
        if (isMounted) setError("Không thể tải lịch sử sự kiện của đơn hàng.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetOrderId, jobId, selectedType]);

  // Group events by servingJobId (for requeued orders with multiple runs)
  const groupedJobs = useMemo(() => {
    if (!events.length) return [];

    const map = new Map<string, ServingJobEvent[]>();
    events.forEach((evt) => {
      const key = evt.servingJobId || "default";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(evt);
    });

    const groups = Array.from(map.entries()).map(([jobKey, list], index) => {
      // Sort within group chronologically by occurredAt / occurredAtUtc
      const sorted = [...list].sort((a, b) => {
        const timeA = new Date(
          a.occurredAtUtc || (a as unknown as { occurredAt?: string }).occurredAt || 0,
        ).getTime();
        const timeB = new Date(
          b.occurredAtUtc || (b as unknown as { occurredAt?: string }).occurredAt || 0,
        ).getTime();
        return timeA - timeB;
      });

      const firstTime =
        sorted[0]?.occurredAtUtc || (sorted[0] as unknown as { occurredAt?: string })?.occurredAt;

      return {
        jobKey,
        runNumber: index + 1,
        startTime: firstTime,
        events: sorted,
      };
    });

    // Sort job groups by their start time
    return groups.sort((a, b) => {
      const timeA = new Date(a.startTime || 0).getTime();
      const timeB = new Date(b.startTime || 0).getTime();
      return timeA - timeB;
    });
  }, [events]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử sự kiện Robot (Timeline)" size="lg">
      <div className="space-y-6">
        {/* Header Summary & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/90 p-4 rounded-2xl border border-gray-200/70 shadow-2xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                MÃ ĐƠN HÀNG
              </span>
              <code className="font-mono font-black text-[#D35400] text-sm sm:text-base">
                {targetOrderId}
              </code>
            </div>
            <div className="border-l border-gray-200 pl-4">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                TỔNG SỐ BƯỚC
              </span>
              <span className="font-extrabold text-gray-900 text-sm">{totalCount} sự kiện</span>
            </div>
          </div>

          {/* Type Filter Select */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-800 transition-all cursor-pointer shadow-2xs"
            >
              {FILTER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
            <p className="text-sm font-bold">Đang tải lịch sử sự kiện robot...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center text-sm font-bold">
            {error}
          </div>
        ) : groupedJobs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 space-y-1">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chưa có ghi nhận sự kiện nào cho đơn hàng này.</p>
            <p className="text-xs text-gray-400 font-normal">
              Đơn hàng chưa vào phục vụ hoặc robot executor chưa report log.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-1">
            {groupedJobs.map((group) => {
              const showGroupHeader = groupedJobs.length > 1;

              return (
                <div key={group.jobKey} className="space-y-4">
                  {/* Job Group Header (If order has multiple runs/requeues) */}
                  {showGroupHeader && (
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <span className="px-3 py-1 bg-orange-100 text-[#D35400] text-xs font-black rounded-lg uppercase">
                        Lần chạy #{group.runNumber}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        Job: {group.jobKey.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-gray-400 font-medium ml-auto">
                        ({group.events.length} sự kiện)
                      </span>
                    </div>
                  )}

                  {/* Vertical Timeline */}
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200/80">
                    {group.events.map((evt: ServingJobEvent, idx: number) => {
                      const evtTypeStr =
                        evt.eventType || (evt as unknown as { type?: string }).type || "";
                      const cfg = EVENT_CONFIG[evtTypeStr] || {
                        label: evtTypeStr || "Sự kiện",
                        bg: "bg-gray-50",
                        text: "text-gray-700",
                        border: "border-gray-200",
                        icon: Activity,
                      };
                      const Icon = cfg.icon;
                      const eventTime =
                        evt.occurredAtUtc || (evt as unknown as { occurredAt?: string }).occurredAt;

                      return (
                        <div key={idx} className="relative group">
                          {/* Dot icon */}
                          <div
                            className={cn(
                              "absolute -left-6 top-2 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs",
                              cfg.border,
                            )}
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                cfg.text.replace("text-", "bg-"),
                              )}
                            />
                          </div>

                          {/* Event Card */}
                          <div
                            className={cn(
                              "p-4 rounded-2xl border transition-all duration-200 hover:shadow-xs space-y-1.5",
                              cfg.bg,
                              cfg.border,
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Icon className={cn("w-4 h-4 shrink-0", cfg.text)} />
                                <span className={cn("text-sm font-extrabold", cfg.text)}>
                                  {cfg.label}
                                </span>
                                {evt.station && (
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-mono font-bold text-gray-700 shadow-3xs">
                                    Trạm: {evt.station}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono font-medium text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {eventTime
                                  ? new Date(eventTime).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    })
                                  : "—"}
                              </span>
                            </div>

                            {/* Dish name if present */}
                            {evt.dishName && (
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5 pt-0.5">
                                <Utensils className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                Món ăn:{" "}
                                <span className="text-gray-900 font-extrabold">{evt.dishName}</span>
                              </p>
                            )}

                            {/* Message / Error Details */}
                            {evt.message && (
                              <p className="text-xs text-gray-700 mt-1 bg-white/80 p-2.5 rounded-xl border border-gray-200/70 font-mono leading-relaxed break-words">
                                {evt.message}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
