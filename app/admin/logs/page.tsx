"use client";

import { useEffect, useRef, useState } from "react";
import { logService } from "@/services/log.service";
import type { LogListItem, LogLevel, HttpMethod, LogFilterParams } from "@/types/log.types";
import { cn } from "@/lib/utils";
import LogDetailDrawer from "@/components/features/logs/log-detail-drawer";

const LOG_LEVEL_OPTIONS: LogLevel[] = ["INFO", "ERROR", "DEBUG"];
const METHOD_OPTIONS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

const LOG_LEVEL_META: Record<string, { dot: string; bg: string }> = {
  ERROR: { dot: "bg-red-500", bg: "bg-red-50 text-red-700" },
  INFO: { dot: "bg-green-500", bg: "bg-green-50 text-green-700" },
  DEBUG: { dot: "bg-yellow-500", bg: "bg-yellow-50 text-yellow-700" },
};

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 500
      ? "text-red-600 bg-red-50"
      : code >= 400
        ? "text-yellow-600 bg-yellow-50"
        : "text-green-600 bg-green-50";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", color)}>
      {code}
    </span>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
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
    pageSize: 20,
    ...(debouncedUrl && { url: debouncedUrl }),
    ...(logLevel && { logLevel }),
    ...(method && { method }),
    ...(statusCodeMin && { statusCodeMin: Number(statusCodeMin) }),
    ...(fromDate && { fromDate: new Date(fromDate).toISOString() }),
    ...(toDate && { toDate: new Date(toDate).toISOString() }),
  };

  useEffect(() => {
    let cancelled = false;

    logService
      .getLogs(filterParams)
      .then((result) => {
        if (cancelled) return;
        setLogs(result.items);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setHasNext(result.hasNextPage);
        setHasPrev(result.hasPreviousPage);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, debouncedUrl, logLevel, method, statusCodeMin, fromDate, toDate]);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      logService
        .getLogs(filterParams)
        .then((result) => {
          setLogs(result.items);
          setTotalPages(result.totalPages);
          setTotalCount(result.totalCount);
          setHasNext(result.hasNextPage);
          setHasPrev(result.hasPreviousPage);
        })
        .catch(() => {});
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const start = Math.max(1, pageNumber - 2);
    const end = Math.min(totalPages, pageNumber + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          disabled={!hasPrev}
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            hasPrev ? "text-gray-700 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed",
          )}
        >
          {"<"}
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => setPageNumber(1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPageNumber(p)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              p === pageNumber
                ? "bg-[#D35400] text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
            <button
              onClick={() => setPageNumber(totalPages)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={!hasNext}
          onClick={() => setPageNumber((p) => p + 1)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            hasNext ? "text-gray-700 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed",
          )}
        >
          {">"}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount > 0 ? `${totalCount} logs recorded` : "Monitor API requests and errors"}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAutoRefresh}
            onChange={(e) => setIsAutoRefresh(e.target.checked)}
            className="accent-[#D35400] w-4 h-4 rounded border-gray-300"
          />
          Auto-refresh (30s)
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <input
            placeholder="🔍 Search URL..."
            value={urlSearch}
            onChange={(e) => setUrlSearch(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
          />

          <select
            value={logLevel}
            onChange={(e) => {
              setLogLevel(e.target.value);
              setPageNumber(1);
            }}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all bg-white"
          >
            <option value="">Level: All</option>
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
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all bg-white"
          >
            <option value="">Method: All</option>
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Status ≥"
            value={statusCodeMin}
            onChange={(e) => {
              setStatusCodeMin(e.target.value);
              setPageNumber(1);
            }}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
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
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageNumber(1);
            }}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all"
          />

          <button
            onClick={clearFilters}
            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}

              {logs.map((log) => {
                const levelMeta = LOG_LEVEL_META[log.logLevel];
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap font-mono">
                      {formatTime(log.createdDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          levelMeta?.bg || "bg-gray-50 text-gray-700",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            levelMeta?.dot || "bg-gray-400",
                          )}
                        />
                        {log.logLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 font-mono max-w-xs truncate">
                      {log.apiUrl}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                        {log.apiMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge code={log.statusCode} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">
                      {new Date(log.endDate).getTime() - new Date(log.createdDate).getTime()}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {renderPagination()}

      <LogDetailDrawer logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}
