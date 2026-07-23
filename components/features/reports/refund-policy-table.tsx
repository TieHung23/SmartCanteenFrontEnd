"use client";

import { AlertCircle, ShieldCheck } from "lucide-react";
import type { RefundPolicyReportItem } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

interface RefundPolicyTableProps {
  data: RefundPolicyReportItem[] | undefined;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function RefundPolicyTable({ data, loading, error, onRetry }: RefundPolicyTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chính sách hoàn tiền</h2>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
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
          <ShieldCheck className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chính sách hoàn tiền</h2>
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
          <ShieldCheck className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chính sách hoàn tiền</h2>
        </div>
        <div className="h-64 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalRequests - a.totalRequests);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Chính sách hoàn tiền</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Chính sách
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Yêu cầu
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Duyệt
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Từ chối
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Tỷ lệ duyệt
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Số tiền
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Đã duyệt
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr
                key={s.policyCode}
                className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors"
              >
                <td className="py-3 px-2">
                  <div className="font-bold text-gray-700">{s.policyName}</div>
                  <div className="text-xs text-gray-400">{s.policyCode}</div>
                </td>
                <td className="py-3 px-2 text-right font-bold text-gray-700">{s.totalRequests}</td>
                <td className="py-3 px-2 text-right font-bold text-green-600">
                  {s.approvedRequests}
                </td>
                <td className="py-3 px-2 text-right font-bold text-red-500">
                  {s.rejectedRequests}
                </td>
                <td className="py-3 px-2 text-right">
                  <span
                    className={`font-bold ${s.approvalRate >= 60 ? "text-green-600" : s.approvalRate >= 40 ? "text-yellow-600" : "text-red-500"}`}
                  >
                    {s.approvalRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-bold text-[#D35400]">
                  {formatVND(s.totalAmount)}
                </td>
                <td className="py-3 px-2 text-right font-bold text-green-600">
                  {formatVND(s.approvedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
