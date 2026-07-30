"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { logService } from "@/services/log.service";
import type { LogListItem, LogLevel, HttpMethod, LogFilterParams } from "@/types/log.types";
import { cn } from "@/lib/utils";
import LogDetailDrawer from "@/components/features/logs/log-detail-drawer";

const LOG_LEVEL_OPTIONS: LogLevel[] = ["INFO", "ERROR", "DEBUG"];
const METHOD_OPTIONS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

const LOG_LEVEL_META: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  ERROR: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  INFO: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  DEBUG: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700 border-blue-200",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 500
      ? "text-red-700 bg-red-50 border-red-200"
      : code >= 400
        ? "text-amber-800 bg-amber-50 border-amber-200"
        : "text-emerald-800 bg-emerald-50 border-emerald-200";
  return (
    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-black border", color)}>
      {code}
    </span>
  );
}

function formatTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [urlSearch, setUrlSearch] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [method, setMethod] = useState("");
  const [statusCodeMin, setStatusCodeMin] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedUrl, setDebouncedUrl] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedUrl(urlSearch);
      setPageNumber(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [urlSearch]);

  const filterParams: LogFilterParams = {
    pageNumber,
    pageSize,
    ...(debouncedUrl && { url: debouncedUrl }),
    ...(logLevel && { logLevel }),
    ...(method && { method }),
    ...(statusCodeMin && { statusCodeMin: Number(statusCodeMin) }),
    ...(fromDate && { fromDate: new Date(fromDate).toISOString() }),
    ...(toDate && { toDate: new Date(toDate).toISOString() }),
  };

  const fetchLogs = () => {
    setLoading(true);
    setError(null);
    logService
      .getLogs(filterParams)
      .then((result) => {
        setLogs(result.items || []);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
        setHasNext(result.hasNextPage);
        setHasPrev(result.hasPreviousPage);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không thể tải nhật ký");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, debouncedUrl, logLevel, method, statusCodeMin, fromDate, toDate]);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoRefresh, pageNumber, debouncedUrl, logLevel, method, statusCodeMin, fromDate, toDate]);

  const clearFilters = () => {
    setUrlSearch("");
    setDebouncedUrl("");
    setLogLevel("");
    setMethod("");
    setStatusCodeMin("");
    setFromDate("");
    setToDate("");
    setPageNumber(1);
  };

  const pageNumbers = Array.from(
    { length: Math.min(totalPages, Math.max(1, pageNumber + 2)) - Math.max(1, pageNumber - 2) + 1 },
    (_, i) => Math.max(1, pageNumber - 2) + i,
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Nhật Ký API</h1>
            <p className="text-base text-gray-500 mt-0.5">
              {totalCount > 0
                ? `Hiển thị ${totalCount.toLocaleString("vi-VN")} bản ghi nhật ký hệ thống`
                : "Theo dõi các yêu cầu HTTP và mã lỗi API real-time"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 cursor-pointer shadow-xs hover:border-[#D35400] transition-colors">
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              className="accent-[#D35400] w-4 h-4 rounded border-gray-300"
            />
            <Activity className={cn("w-4 h-4 text-[#D35400]", isAutoRefresh && "animate-pulse")} />
            Tự động làm mới (30s)
          </label>

          <button
            onClick={fetchLogs}
            className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95 shrink-0"
            title="Làm mới ngay"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
          <input
            value={urlSearch}
            onChange={(e) => setUrlSearch(e.target.value)}
            placeholder="Tìm theo URL API (ví dụ: /api/orders, /api/auth)..."
            className="h-14 w-full rounded-2xl border border-gray-200/80 bg-gray-50/80 pl-14 pr-5 text-base font-semibold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:bg-white focus:ring-2 focus:ring-[#D35400]/15 placeholder:text-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          <select
            value={logLevel}
            onChange={(e) => {
              setLogLevel(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          >
            <option value="">Mức: Tất cả</option>
            {LOG_LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          >
            <option value="">Phương thức: Tất cả</option>
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Mã lỗi ≥ 400"
            value={statusCodeMin}
            onChange={(e) => {
              setStatusCodeMin(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15 placeholder:text-gray-400"
            min={100}
            max={599}
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          />

          <button
            onClick={clearFilters}
            className="h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Xóa bộ lọc
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Table ── */}
      {loading && logs.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 animate-spin rounded-full border-4 border-[#D35400]/20 border-t-[#D35400]" />
          <p className="text-base font-bold text-gray-500">Đang tải nhật ký API...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400">Không tìm thấy bản ghi nhật ký nào.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Thời gian
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mức log
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    URL API
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Phương thức
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mã Trạng Thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Thời lượng
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const levelMeta = LOG_LEVEL_META[log.logLevel] || LOG_LEVEL_META.INFO;
                  const methodClass =
                    METHOD_STYLE[log.apiMethod] || "bg-gray-100 text-gray-700 border-gray-200";
                  const durationMs =
                    new Date(log.endDate).getTime() - new Date(log.createdDate).getTime();

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className="hover:bg-orange-50/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-gray-600 font-mono whitespace-nowrap">
                        {formatTime(log.createdDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase",
                            levelMeta.bg,
                            levelMeta.text,
                            levelMeta.border,
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", levelMeta.dot)} />
                          {log.logLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-gray-900 max-w-xs truncate">
                        {log.apiUrl}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-lg text-xs font-black font-mono border",
                            methodClass,
                          )}
                        >
                          {log.apiMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge code={log.statusCode} />
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">
                        {durationMs}ms
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogId(log.id);
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#D35400] hover:text-white"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                Trang <span className="font-black text-gray-800">{pageNumber}</span> trên{" "}
                <span className="font-black text-gray-800">{totalPages}</span> ({totalCount} bản
                ghi)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev || loading}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setPageNumber(page)}
                    disabled={loading}
                    className={cn(
                      "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-4 text-base font-black transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      page === pageNumber
                        ? "border-[#D35400] bg-[#D35400] text-white shadow-md shadow-orange-500/25"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400]",
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!hasNext || loading}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Log Detail Drawer ── */}
      <LogDetailDrawer logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}
