"use client";

import { CalendarDays, AlertCircle } from "lucide-react";
import type { SessionReportItem } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function renderTimeRange(fromIso?: string | null, toIso?: string | null): string {
  const fromStr = formatTime(fromIso);
  const toStr = formatTime(toIso);
  if (fromStr === "—" && toStr === "—") return "—";
  if (fromStr === toStr) return fromStr;
  return `${fromStr} - ${toStr}`;
}

interface SessionReportTableProps {
  data: SessionReportItem[] | undefined;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function SessionReportTable({ data, loading, error, onRetry }: SessionReportTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Hiệu suất ca phục vụ</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Hiệu suất ca phục vụ</h2>
        </div>
        <div className="h-64 rounded-3xl bg-red-50 border border-dashed border-red-200 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-300" />
          <p className="text-sm font-bold text-red-400">Tải dữ liệu thất bại</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Hiệu suất ca phục vụ</h2>
        </div>
        <div className="h-64 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <CalendarDays className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu ca phục vụ</p>
        </div>
      </div>
    );
  }

  // Filter out invalid/unassigned test session records (empty sessionName or min-date 0001-01-01)
  const validSessions = data.filter((s) => {
    const hasName = Boolean(s.sessionName && s.sessionName.trim() !== "");
    const hasDate = Boolean(s.availableFrom && new Date(s.availableFrom).getFullYear() >= 2000);
    return hasName && hasDate;
  });

  if (validSessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Hiệu suất ca phục vụ</h2>
        </div>
        <div className="h-64 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <CalendarDays className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu ca phục vụ hợp lệ</p>
        </div>
      </div>
    );
  }

  const sorted = [...validSessions].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Hiệu suất ca phục vụ</h2>
        <span className="text-sm font-semibold text-gray-400 ml-auto">{sorted.length} ca</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Ca
              </th>
              <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Thời gian
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Đơn
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Hoàn thành
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Tỷ lệ
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Doanh thu
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Hoàn tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr
                key={s.sessionId}
                className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors"
              >
                <td className="py-3 px-2 font-bold text-gray-700 max-w-[160px] truncate">
                  {s.sessionName}
                </td>
                <td className="py-3 px-2 text-gray-500 text-xs whitespace-nowrap">
                  {renderTimeRange(s.availableFrom, s.availableTo)}
                </td>
                <td className="py-3 px-2 text-right font-bold text-gray-700">{s.totalOrders}</td>
                <td className="py-3 px-2 text-right font-bold text-green-600">
                  {s.completedOrders}
                </td>
                <td className="py-3 px-2 text-right">
                  <span
                    className={`font-bold ${s.completionRate >= 80 ? "text-green-600" : s.completionRate >= 50 ? "text-yellow-600" : "text-red-500"}`}
                  >
                    {s.completionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-bold text-[#D35400]">
                  {formatVND(s.revenue)}
                </td>
                <td className="py-3 px-2 text-right font-bold text-gray-500">
                  {s.refundRequests > 0
                    ? `${s.refundRequests} (${formatVND(s.refundAmount)})`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
