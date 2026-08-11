"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, ShieldAlert, BadgeCheck, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { verificationService } from "@/services/verification.service";
import type { AdminVerificationListItem } from "@/types/verification.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";
import { VerifyDetailsContent } from "./_components/verify-details-content";

const STATUS_STYLES: Record<number, { label: string; bg: string }> = {
  0: { label: "Chờ xử lý", bg: "bg-amber-100 text-amber-800 border border-amber-200" },
  1: { label: "Chờ xử lý", bg: "bg-amber-100 text-amber-800 border border-amber-200" },
  2: { label: "Đã duyệt", bg: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  3: { label: "Từ chối", bg: "bg-red-100 text-red-800 border border-red-200" },
  4: { label: "Hết hạn", bg: "bg-gray-100 text-gray-800 border border-gray-200" },
};

const ALL_PAGE_SIZE = 1000;

export default function ManagerVerifyPage() {
  const [requests, setRequests] = useState<AdminVerificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!statusFilter) setPageNumber(1);
  };

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const handleOpenDetails = (id: string) => {
    setDetailsId(id);
    setIsDetailsOpen(true);
  };

  const refetch = () => {
    if (!statusFilter) {
      fetchAllStatuses();
    } else {
      fetchByStatus(Number(statusFilter), pageNumber);
    }
  };

  const fetchAllStatuses = async () => {
    setLoading(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        verificationService.adminList({ pageSize: ALL_PAGE_SIZE, status: 1 }),
        verificationService.adminList({ pageSize: ALL_PAGE_SIZE, status: 2 }),
        verificationService.adminList({ pageSize: ALL_PAGE_SIZE, status: 3 }),
      ]);
      const all = [...pending.items, ...approved.items, ...rejected.items];
      all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setRequests(all);
      setTotalCount(all.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchByStatus = async (status: number, page: number) => {
    setLoading(true);
    try {
      const result = await verificationService.adminList({ pageSize, pageNumber: page, status });
      setRequests(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!statusFilter) {
      fetchAllStatuses();
    } else {
      fetchByStatus(Number(statusFilter), 1);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (statusFilter) {
      fetchByStatus(Number(statusFilter), pageNumber);
    }
  }, [statusFilter, pageNumber]);

  const searched = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return requests;
    return requests.filter(
      (req) => req.userName.toLowerCase().includes(q) || req.userEmail.toLowerCase().includes(q),
    );
  }, [requests, search]);

  const displaying = useMemo(() => {
    if (statusFilter) return searched;
    const start = (pageNumber - 1) * pageSize;
    return searched.slice(start, start + pageSize);
  }, [searched, pageNumber, pageSize, statusFilter]);

  const displayTotal = useMemo(() => {
    if (statusFilter) return totalCount;
    return searched.length;
  }, [statusFilter, totalCount, searched]);

  const totalPages = Math.ceil(displayTotal / pageSize);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, pageNumber - 2);
    const end = Math.min(totalPages, pageNumber + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pageNumber, totalPages]);

  const firstItemIndex = displayTotal === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const lastItemIndex = Math.min(pageNumber * pageSize, displayTotal);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <BadgeCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Xác thực danh tính
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              Phê duyệt hoặc từ chối các yêu cầu xác thực danh tính sinh viên.
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo tên, email, MSSV..."
              className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() =>
              statusFilter ? fetchByStatus(Number(statusFilter), 1) : fetchAllStatuses()
            }
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
            Đang tải danh sách yêu cầu xác thực...
          </p>
        </div>
      ) : displaying.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/60 bg-white p-16 text-center shadow-xs">
          <ShieldAlert className="h-12 w-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400">Không tìm thấy yêu cầu xác thực nào.</p>
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
                    Email
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tài liệu
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Ngày gửi
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displaying.map((req) => {
                  const status = req.status ?? 0;
                  const style = STATUS_STYLES[status] || STATUS_STYLES[0];
                  const hasUserName = Boolean(req.userName && req.userName.trim() !== "");
                  const hasUserEmail = Boolean(req.userEmail && req.userEmail.trim() !== "");
                  const userNameDisplay = hasUserName
                    ? req.userName
                    : `User #${req.userId?.slice(0, 8) || req.id.slice(0, 8)}`;
                  const userEmailDisplay = hasUserEmail ? req.userEmail : "Chưa cập nhật email";

                  return (
                    <tr key={req.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            hasUserName ? "text-gray-900" : "text-gray-400 italic font-normal",
                          )}
                        >
                          {userNameDisplay}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            hasUserEmail ? "text-gray-500" : "text-gray-400 italic font-normal",
                          )}
                        >
                          {userEmailDisplay}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                          {req.documentCount} file(s)
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
                        {new Date(req.submittedAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
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
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-gray-100 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-semibold text-gray-500">
                Hiển thị{" "}
                <span className="font-black text-gray-800">
                  {firstItemIndex}-{lastItemIndex}
                </span>{" "}
                trong <span className="font-black text-gray-800">{displayTotal}</span> yêu cầu
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
          {totalPages <= 1 && (
            <div className="border-t border-gray-100 px-8 py-5 bg-gray-50/50">
              <p className="text-base font-semibold text-gray-500">
                Hiển thị <span className="font-black text-gray-800">{displaying.length}</span> /{" "}
                <span className="font-black text-gray-800">{displayTotal}</span> yêu cầu
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── VERIFY DETAIL MODAL ── */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Chi tiết yêu cầu xác thực"
        size="lg"
      >
        {detailsId && (
          <VerifyDetailsContent
            requestId={detailsId}
            onSuccess={() => {
              setIsDetailsOpen(false);
              refetch();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
