"use client";

import { useEffect, useState } from "react";
import { Eye, ShieldAlert } from "lucide-react";
import { verificationService } from "@/services/verification.service";
import type { AdminVerificationListItem } from "@/types/verification.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";
import { VerifyDetailsContent } from "./_components/verify-details-content";

const STATUS_STYLES: Record<number, { label: string; color: string; bg: string; border: string }> =
  {
    0: {
      label: "Chờ xử lý",
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      border: "border-yellow-200/60",
    },
    1: {
      label: "Chờ xử lý",
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      border: "border-yellow-200/60",
    },
    2: {
      label: "Đã duyệt",
      color: "text-green-800",
      bg: "bg-green-100",
      border: "border-green-200/60",
    },
    3: { label: "Từ chối", color: "text-red-800", bg: "bg-red-100", border: "border-red-200/60" },
    4: {
      label: "Hết hạn",
      color: "text-gray-800",
      bg: "bg-gray-100",
      border: "border-gray-200/60",
    },
  };

export default function ManagerVerifyPage() {
  const [requests, setRequests] = useState<AdminVerificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const handleOpenDetails = (id: string) => {
    setDetailsId(id);
    setIsDetailsOpen(true);
  };

  const fetchRequests = async (status?: string) => {
    setLoading(true);
    try {
      if (!status) {
        const [pending, approved, rejected] = await Promise.all([
          verificationService.adminList({ pageSize: 100, status: 1 }),
          verificationService.adminList({ pageSize: 100, status: 2 }),
          verificationService.adminList({ pageSize: 100, status: 3 }),
        ]);
        const all = [...pending.items, ...approved.items, ...rejected.items];
        all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setRequests(all);
      } else {
        const statusNum = Number(status);
        const result = await verificationService.adminList({
          pageSize: 100,
          ...(statusNum && !isNaN(statusNum) ? { status: statusNum } : {}),
        });
        setRequests(result.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, []);

  const filtered = requests;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Xác thực danh tính</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Phê duyệt hoặc bác bỏ các yêu cầu xác thực danh tính sinh viên.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            fetchRequests(e.target.value);
          }}
          className="w-full sm:w-60 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-xs cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Chờ xử lý</option>
          <option value="2">Đã duyệt</option>
          <option value="3">Từ chối</option>
        </select>
      </div>

      {/* Table/List Container */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">
            Đang tải danh sách yêu cầu xác thực...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-12 h-12 text-gray-300" />
          <p className="text-gray-400 font-bold text-lg">Chưa có yêu cầu xác thực nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((req) => {
            const status = req.status ?? 0;
            const style = STATUS_STYLES[status] || STATUS_STYLES[0];
            return (
              <div
                key={req.id}
                onClick={() => handleOpenDetails(req.id)}
                className="bg-white rounded-3xl border border-gray-200/30 p-6 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xs gap-5 card-3d"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shrink-0 font-bold text-lg uppercase">
                        {req.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate tracking-wide">
                          {req.userName}
                        </h3>
                        <p className="text-sm font-semibold text-gray-400 truncate">
                          {req.userEmail}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0",
                        style.bg,
                        style.color,
                        "border",
                        style.border,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span className="font-semibold text-gray-400">Tài liệu:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                      {req.documentCount} file(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="font-semibold text-gray-400">Ngày gửi:</span>
                    <span className="font-bold text-gray-600">
                      {new Date(req.submittedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(req.id);
                  }}
                  className="w-full py-3 bg-[#D35400]/10 hover:bg-[#D35400] text-[#D35400] hover:text-white rounded-2xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {status === 2 ? "Xem kết quả" : status === 3 ? "Xem kết quả" : "Xem xét"}
                </button>
              </div>
            );
          })}
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
              fetchRequests(statusFilter || undefined);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
