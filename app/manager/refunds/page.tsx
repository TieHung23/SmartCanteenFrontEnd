"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ShieldAlert } from "lucide-react";
import { refundService } from "@/services/refund.service";
import type { ManagerRefundListItem } from "@/types/refund.types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: "text-yellow-800", bg: "bg-yellow-100" },
  Approved: { label: "Approved", color: "text-green-800", bg: "bg-green-100" },
  Rejected: { label: "Rejected", color: "text-red-800", bg: "bg-red-100" },
};

export default function ManagerRefundsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ManagerRefundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchRequests = async (status?: string) => {
    if (status !== undefined) setLoading(true);
    try {
      const statusNum = status ? Number(status) : undefined;
      const result = await refundService.managerList({
        status: statusNum && !isNaN(statusNum) ? statusNum : undefined,
        pageSize: 100,
      });
      setRequests(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      if (status !== undefined) setLoading(false);
    }
  };

  useEffect(() => {
    const initial = async () => {
      try {
        const result = await refundService.managerList({ pageSize: 100 });
        setRequests(result.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initial();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Refund Requests</h1>
        <p className="text-lg text-gray-500 mt-1.5">Phê duyệt hoặc từ chối các yêu cầu hoàn tiền của người dùng.</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            fetchRequests(e.target.value);
          }}
          className="w-full sm:w-60 px-4 py-3.5 bg-white border border-gray-200/60 rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-2xs cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="1">Pending</option>
          <option value="2">Approved</option>
          <option value="3">Rejected</option>
        </select>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách yêu cầu hoàn tiền...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/60 p-16 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-12 h-12 text-gray-300" />
          <p className="text-gray-400 font-bold text-lg">Chưa có yêu cầu hoàn tiền nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const style = STATUS_STYLES[req.status] || STATUS_STYLES.Pending;
            return (
              <div
                key={req.id}
                onClick={() => router.push(`/manager/refunds/${req.id}`)}
                className="bg-white rounded-3xl border border-gray-200/60 p-6 hover:shadow-md hover:border-orange-200/60 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-2xs gap-5 card-3d"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">User ID</p>
                      <p className="text-sm font-mono font-bold text-gray-800 truncate mt-0.5">
                        {req.userId.slice(0, 12)}...
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        style.bg,
                        style.color,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chính sách áp dụng</p>
                    <p className="text-sm font-bold text-gray-750 mt-0.5 line-clamp-1">
                      {req.policyName}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Số tiền hoàn</p>
                      <p className="text-lg font-bold text-[#D35400] mt-0.5">
                        {new Intl.NumberFormat("vi-VN").format(req.refundAmount)} pts
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tỷ lệ</p>
                      <span className="inline-block mt-1 font-bold text-[#D35400] bg-orange-50 border border-orange-100/40 rounded-lg px-2 py-0.5 text-xs">
                        Hoàn {req.refundPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Yêu cầu lúc:</span>
                    <span className="font-semibold text-gray-500">
                      {new Date(req.createdAtUtc).toLocaleDateString("vi-VN", {
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
                    router.push(`/manager/refunds/${req.id}`);
                  }}
                  className="w-full py-3 bg-[#D35400]/10 hover:bg-[#D35400] text-[#D35400] hover:text-white rounded-2xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
