"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Modal from "@/app/manager/_components/modal";
import { servingJobService } from "@/services/serving-job.service";
import type {
  ServingJobEvent,
  ServingJobEventsResponse,
  ServingJobEventType,
} from "@/types/serving-job.types";
import { cn } from "@/lib/utils";

interface ServingJobEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  orderId?: string | null;
}

const EVENT_CONFIG: Record<
  ServingJobEventType,
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
    label: "Đã nhận job",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Activity,
  },
  PickStarted: {
    label: "Bắt đầu gắp món",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Utensils,
  },
  PickCompleted: {
    label: "Gắp món thành công",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  PlaceCompleted: {
    label: "Đặt khay thành công",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CheckCircle2,
  },
  Error: {
    label: "Sự cố / Lỗi",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertCircle,
  },
  Recovered: {
    label: "Phục hồi thành công",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    icon: RotateCcw,
  },
  EmergencyStop: {
    label: "Dừng khẩn cấp",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    icon: OctagonX,
  },
};

export default function ServingJobEventsModal({
  isOpen,
  onClose,
  jobId,
  orderId,
}: ServingJobEventsModalProps) {
  const [data, setData] = useState<ServingJobEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !jobId) return;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await servingJobService.getEvents(jobId);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to fetch serving job events:", err);
        if (isMounted) setError("Không thể tải lịch sử sự kiện của job này.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const events = data?.events || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử sự kiện Robot (Timeline)" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/60 text-sm">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider text-xs block">
              Job ID
            </span>
            <code className="font-mono font-bold text-gray-800 text-xs md:text-sm">{jobId}</code>
          </div>
          {orderId && (
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider text-xs block">
                Mã Đơn
              </span>
              <code className="font-mono font-bold text-[#D35400] text-xs md:text-sm">
                {orderId.slice(0, 8)}...
              </code>
            </div>
          )}
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider text-xs block">
              Tổng số bước
            </span>
            <span className="font-extrabold text-gray-900">{events.length} sự kiện</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
            <p className="text-sm font-bold">Đang tải lịch sử sự kiện...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-center text-sm font-bold">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            Chưa có ghi nhận sự kiện nào cho công việc này.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {events.map((evt: ServingJobEvent, idx: number) => {
              const cfg = EVENT_CONFIG[evt.eventType] || {
                label: evt.eventType,
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
                icon: Activity,
              };
              const Icon = cfg.icon;

              return (
                <div key={idx} className="relative group">
                  {/* Dot icon */}
                  <div
                    className={cn(
                      "absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110",
                      cfg.border,
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", cfg.bg.replace("bg-", "bg-"))} />
                  </div>

                  {/* Card */}
                  <div
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-200 hover:shadow-xs",
                      cfg.bg,
                      cfg.border,
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", cfg.text)} />
                        <span className={cn("text-sm font-extrabold", cfg.text)}>{cfg.label}</span>
                        {evt.station && (
                          <span className="px-2 py-0.5 rounded-md bg-white border text-xs font-mono font-bold text-gray-700 shadow-2xs">
                            Trạm: {evt.station}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(evt.occurredAtUtc).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>

                    {evt.dishName && (
                      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                        <Utensils className="w-3.5 h-3.5 text-orange-500" />
                        Món ăn: <span className="text-gray-900">{evt.dishName}</span>
                      </p>
                    )}

                    {evt.message && (
                      <p className="text-xs text-gray-600 mt-1.5 bg-white/70 p-2 rounded-xl border border-gray-200/50 font-mono">
                        {evt.message}
                      </p>
                    )}
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
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
