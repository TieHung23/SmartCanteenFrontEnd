"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Search,
  Coffee,
  TrendingUp,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from "lucide-react";
import { reportService } from "@/services/report.service";
import { sessionService } from "@/services/session.service";
import { cn } from "@/lib/utils";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount?: number) {
  if (!amount) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

type SortField = "newest" | "oldest" | "revenue" | "orders";

export default function SessionReportSelectPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortField>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const sessionsQuery = useQuery({
    queryKey: ["report-sessions-list"],
    queryFn: () => reportService.getSessions(),
    staleTime: 30_000,
  });

  const sessionListQuery = useQuery({
    queryKey: ["all-sessions-manager"],
    queryFn: () => sessionService.getSessions({ pageSize: 100 }),
    staleTime: 30_000,
  });

  const isLoading = sessionsQuery.isLoading || sessionListQuery.isLoading;

  const rawSessions = useMemo(() => {
    const reportItems = sessionsQuery.data?.items || [];
    const allItems = sessionListQuery.data?.items || [];

    if (reportItems.length > 0) {
      return reportItems.map((item) => {
        const fullSession = allItems.find((s) => s.id === item.sessionId);
        return {
          id: item.sessionId,
          name: item.sessionName,
          availableFrom: item.availableFrom || fullSession?.availableFrom,
          availableTo: item.availableTo || fullSession?.availableTo,
          totalOrders: item.totalOrders || 0,
          completedOrders: item.completedOrders || 0,
          revenue: item.revenue || 0,
          refundAmount: item.refundAmount || 0,
          completionRate: item.completionRate || 0,
          isActive: fullSession
            ? Boolean(fullSession.isActive)
            : item.availableTo
              ? new Date(item.availableTo) > new Date()
              : false,
          isFinalized: Boolean(fullSession?.isFinalized),
        };
      });
    }

    return allItems.map((s) => ({
      id: s.id,
      name: s.name,
      availableFrom: s.availableFrom,
      availableTo: s.availableTo,
      totalOrders: s.dishes?.length || 0,
      completedOrders: 0,
      revenue: 0,
      refundAmount: 0,
      completionRate: 0,
      isActive: Boolean(s.isActive) && (!s.availableTo || new Date(s.availableTo) > new Date()),
      isFinalized: Boolean(s.isFinalized),
    }));
  }, [sessionsQuery.data, sessionListQuery.data]);

  // 1. FILTERING
  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rawSessions.filter((session) => {
      const matchSearch =
        !q || session.name.toLowerCase().includes(q) || session.id.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "active") matchStatus = session.isActive;
      if (statusFilter === "ended") matchStatus = !session.isActive;
      if (statusFilter === "finalized") matchStatus = session.isFinalized;

      return matchSearch && matchStatus;
    });
  }, [rawSessions, search, statusFilter]);

  // 2. SORTING (NEWEST SESSIONS ON TOP BY DEFAULT)
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      if (sortBy === "newest") {
        const timeA = new Date(a.availableFrom || 0).getTime();
        const timeB = new Date(b.availableFrom || 0).getTime();
        return timeB - timeA; // Mới nhất lên đầu
      }
      if (sortBy === "oldest") {
        const timeA = new Date(a.availableFrom || 0).getTime();
        const timeB = new Date(b.availableFrom || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === "revenue") {
        return b.revenue - a.revenue;
      }
      if (sortBy === "orders") {
        return b.totalOrders - a.totalOrders;
      }
      return 0;
    });
  }, [filteredSessions, sortBy]);

  // 3. PAGINATION
  const totalCount = sortedSessions.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return sortedSessions.slice(start, start + pageSize);
  }, [sortedSessions, pageNumber, pageSize]);

  const handleSelectSession = (id: string) => {
    router.push(`/manager/reports/sessions/${id}`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
    setPageNumber(1);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Báo cáo ca phục vụ
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              Theo dõi doanh thu, số lượng đơn hàng và xu hướng đặt món theo từng ca.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sessionsQuery.refetch();
              sessionListQuery.refetch();
            }}
            className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Form Ngang: Toolbar & Controls ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="Tìm theo tên ca phục vụ, ID..."
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-11 pr-4 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-[#D35400] focus:bg-white focus:ring-2 focus:ring-[#D35400]/15 placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          >
            <option value="all">Tất cả ca phục vụ</option>
            <option value="active">Đang phục vụ</option>
            <option value="ended">Đã đóng ca</option>
            <option value="finalized">Đã chốt ca</option>
          </select>

          {/* Sort Order Dropdown (Newest on top default) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="revenue">Doanh thu cao nhất</option>
            <option value="orders">Nhiều đơn nhất</option>
          </select>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageNumber(1);
            }}
            className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15"
          >
            <option value={15}>15 dòng / trang</option>
            <option value={30}>30 dòng / trang</option>
            <option value={50}>50 dòng / trang</option>
            <option value={100}>100 dòng / trang</option>
          </select>

          {/* Clear Filter button */}
          {(search || statusFilter !== "all" || sortBy !== "newest") && (
            <button
              onClick={clearFilters}
              className="h-12 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Xóa bộ lọc"
            >
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/60 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-white text-[#D35400] shadow-xs"
                  : "text-gray-500 hover:text-gray-800",
              )}
              title="Xem dạng Bảng Ngang (Tối ưu xem hàng trăm ca)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "grid"
                  ? "bg-white text-[#D35400] shadow-xs"
                  : "text-gray-500 hover:text-gray-800",
              )}
              title="Xem dạng Thẻ Grid"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {isLoading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách ca phục vụ...</p>
        </div>
      ) : paginatedSessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy ca phục vụ nào phù hợp.</p>
        </div>
      ) : viewMode === "table" ? (
        /* Dạng Bảng Ngang (Horizontal Table Layout - Maximum Data Density) */
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tên Ca Phục Vụ
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Thời Gian Hoạt Động
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tổng Đơn Hàng
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Doanh Thu
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tỷ Lệ Hoàn Thành
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng Thái
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className="hover:bg-orange-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D35400] flex items-center justify-center font-bold shrink-0">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 group-hover:text-[#D35400] transition-colors truncate">
                            {session.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            ID: {session.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-gray-800">
                        {formatDate(session.availableFrom)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        đến {formatDate(session.availableTo)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-gray-900">
                        {session.totalOrders} đơn
                      </span>
                      {session.completedOrders > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Xong: {session.completedOrders} đơn
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-[#D35400]">
                        {formatMoney(session.revenue)}
                      </span>
                      {session.refundAmount > 0 && (
                        <p className="text-[10px] text-red-500 font-bold">
                          Hoàn: {formatMoney(session.refundAmount)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-xl px-2.5 py-1 text-xs">
                        {session.completionRate ? `${session.completionRate.toFixed(0)}%` : "100%"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {session.isActive ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
                            Live
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider">
                            Đã đóng
                          </span>
                        )}
                        {session.isFinalized && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-black uppercase">
                            Đã chốt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSession(session.id);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#D35400] hover:text-white"
                        title="Xem chi tiết báo cáo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dạng Thẻ Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xs group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center font-bold">
                    <Coffee className="w-5 h-5" />
                  </div>
                  {session.isActive && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase">
                      Live
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#D35400] transition-colors">
                  {session.name}
                </h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>🕒 Bắt đầu: {formatDate(session.availableFrom)}</p>
                  <p>⌛ Kết thúc: {formatDate(session.availableTo)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm font-bold text-[#D35400]">
                <span>Xem báo cáo chi tiết</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-500">
            Hiển thị{" "}
            <span className="font-black text-gray-800">
              {(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize, totalCount)}
            </span>{" "}
            trong tổng số <span className="font-black text-gray-800">{totalCount}</span> ca phục vụ
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPageNumber(p)}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3.5 text-sm font-black transition-all",
                  p === pageNumber
                    ? "border-[#D35400] bg-[#D35400] text-white shadow-md shadow-orange-500/25"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400]",
                )}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
