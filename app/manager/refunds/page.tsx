"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { refundService } from "@/services/refund.service";
import type { ManagerRefundListItem } from "@/types/refund.types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50" },
  Approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50" },
  Rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refund Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Approve or reject refund requests</p>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            fetchRequests(e.target.value);
          }}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 bg-white"
        >
          <option value="">All statuses</option>
          <option value="1">Pending</option>
          <option value="2">Approved</option>
          <option value="3">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Policy
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    No refund requests.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const style = STATUS_STYLES[req.status] || STATUS_STYLES.Pending;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-mono text-gray-700">
                          {req.userId.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700">{req.policyName}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat("vi-VN").format(req.refundAmount)} pts
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.refundPercent}% of{" "}
                          {new Intl.NumberFormat("vi-VN").format(req.orderAmount)} pts
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            style.bg,
                            style.color,
                          )}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {new Date(req.createdAtUtc).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => router.push(`/manager/refunds/${req.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D35400] text-white rounded-lg text-xs font-semibold hover:bg-[#b84900] transition-colors ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
