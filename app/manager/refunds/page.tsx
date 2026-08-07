"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Eye, ShieldAlert, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { refundService } from "@/services/refund.service";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";
import { RefundDetailsContent } from "./_components/refund-details-content";

const getRefundStatusStyle = (status: string | number, changeProposalId?: string | null) => {
  const s = String(status).toLowerCase();
  if (s === "pending" || s === "1" || s === "0") {
    return { label: "Chờ xử lý", bg: "bg-amber-100 text-amber-800 border border-amber-200" };
  }
  if (s === "approved" || s === "2") {
    if (changeProposalId) {
      return { label: "Tự động hoàn", bg: "bg-blue-100 text-blue-800 border border-blue-200" };
    }
    return { label: "Đã duyệt", bg: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
  }
  if (s === "rejected" || s === "3") {
    return { label: "Từ chối", bg: "bg-red-100 text-red-800 border border-red-200" };
  }
  return { label: "Chờ xử lý", bg: "bg-amber-100 text-amber-800 border border-amber-200" };
};

export default function ManagerRefundsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const refundsQuery = useQuery({
    queryKey: ["manager-refunds", statusFilter, pageNumber],
    queryFn: () => {
      const statusNum = statusFilter ? Number(statusFilter) : undefined;
      return refundService.managerList({
        status: statusNum && !isNaN(statusNum) ? statusNum : undefined,
        pageSize,
        pageNumber,
      });
    },
    staleTime: 30_000,
    retry: 2,
  });

  const loading = refundsQuery.isLoading;
  const totalCount = refundsQuery.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleOpenDetails = (id: string) => {
    setDetailsId(id);
    setIsDetailsOpen(true);
  };

  const filtered = useMemo(() => {
    const items = refundsQuery.data?.items || [];
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((r) => {
      const style = getRefundStatusStyle(r.status);
      return (
        (r.userId || "").toLowerCase().includes(q) ||
        (r.userName || "").toLowerCase().includes(q) ||
        (r.policyName || "").toLowerCase().includes(q) ||
        style.label.toLowerCase().includes(q)
      );
    });
  }, [refundsQuery.data?.items, search]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, pageNumber - 2);
    const end = Math.min(totalPages, pageNumber + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pageNumber, totalPages]);

  const firstItemIndex = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const lastItemIndex = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Yêu cầu hoàn tiền</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Phê duyệt hoặc từ chối các yêu cầu hoàn tiền của người dùng.
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo user ID, tên khách, chính sách..."
              className="w-full pl-12 pr-5 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
            />
          </div>
          <button
            onClick={() => refundsQuery.refetch()}
            className="px-6 py-3.5 bg-gray-900 text-white rounded-3xl text-base font-bold hover:bg-gray-800 transition-all shadow-xs active:scale-98 shrink-0"
          >
            Tìm kiếm
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageNumber(1);
          }}
          className="h-12 rounded-3xl border border-gray-200 bg-white px-5 text-base font-bold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/15 w-full lg:w-56 shadow-2xs"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Chờ xử lý</option>
          <option value="2">Đã duyệt</option>
          <option value="3">Từ chối</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#D35400]/20 border-t-[#D35400]" />
          </div>
          <p className="text-base font-bold text-gray-500">
            Đang tải danh sách yêu cầu hoàn tiền...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
          <ShieldAlert className="h-12 w-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400">Không tìm thấy yêu cầu hoàn tiền nào.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Người dùng
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Món ăn
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Chính sách
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Số tiền hoàn
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tỷ lệ
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Ngày yêu cầu
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((req) => {
                  const style = getRefundStatusStyle(req.status, req.changeProposalId);
                  const dishName =
                    req.dishName || req.currentDishName || req.selectedDishName || "Toàn bộ đơn";
                  const userName =
                    req.userName ||
                    (req.userId ? `Khách hàng (${req.userId.slice(0, 8)})` : "Khách hàng");

                  return (
                    <tr key={req.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900">{userName}</p>
                        {req.userId && (
                          <p className="text-[10px] text-gray-400 font-mono">
                            ID: {req.userId.slice(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800">{dishName}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-700">
                        {req.policyName || "Hoàn tiền ca"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-black text-[#D35400] inline-flex items-center gap-1">
                          {(req.refundAmount || 0).toLocaleString("vi-VN")}
                          <Image
                            src="/logo_point.png"
                            alt="coin"
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-xl px-2.5 py-1 text-xs">
                          {req.refundPercent}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                            style.bg,
                          )}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {req.createdAtUtc
                          ? new Date(req.createdAtUtc).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(req.id)}
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
                Hiển thị{" "}
                <span className="font-black text-gray-800">
                  {firstItemIndex}-{lastItemIndex}
                </span>{" "}
                trong <span className="font-black text-gray-800">{totalCount}</span> yêu cầu
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber === 1 || loading}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPageNumber(1)}
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
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    <span className="hidden px-1 text-base font-black text-gray-400 sm:inline">
                      ...
                    </span>
                    <button
                      onClick={() => setPageNumber(totalPages)}
                      className="hidden h-11 min-w-11 rounded-xl border border-gray-200 px-4 text-base font-black text-gray-600 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] sm:inline-flex sm:items-center sm:justify-center"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                  disabled={pageNumber === totalPages || loading}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-[#D35400]/30 hover:bg-[#D35400]/5 hover:text-[#D35400] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Chi tiết yêu cầu hoàn tiền"
        size="lg"
      >
        {detailsId && (
          <RefundDetailsContent
            requestId={detailsId}
            onSuccess={() => {
              setIsDetailsOpen(false);
              refundsQuery.refetch();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
