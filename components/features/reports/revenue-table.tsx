"use client";

import { AlertCircle, Table2 } from "lucide-react";
import type { RevenueDataPoint } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

interface RevenueTableProps {
  data: RevenueDataPoint[] | undefined;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function RevenueTable({ data, loading, error, onRetry }: RevenueTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Table2 className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chi tiết doanh thu</h2>
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
          <Table2 className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chi tiết doanh thu</h2>
        </div>
        <div className="h-64 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <Table2 className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Table2 className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Chi tiết doanh thu</h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl ml-auto">
            {data.length} ngày
          </span>
        </div>

        <div className="border border-gray-200/80 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200 z-10">
              <tr>
                <th className="w-1/4 text-left py-3.5 px-4 font-black text-gray-500 uppercase tracking-wider text-xs">
                  Ngày
                </th>
                <th className="w-1/4 text-right py-3.5 px-4 font-black text-gray-500 uppercase tracking-wider text-xs">
                  Đơn hàng
                </th>
                <th className="w-1/4 text-right py-3.5 px-4 font-black text-gray-500 uppercase tracking-wider text-xs">
                  Doanh thu
                </th>
                <th className="w-1/4 text-right py-3.5 px-4 font-black text-gray-500 uppercase tracking-wider text-xs">
                  TB / đơn
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((row) => {
                const parts = row.date.split("-");
                const dateStr =
                  parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : row.date;
                const avg = row.orders > 0 ? row.revenue / row.orders : 0;
                return (
                  <tr key={row.date} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-800 whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-700 whitespace-nowrap">
                      {row.orders.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#D35400] whitespace-nowrap">
                      {formatVND(row.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-600 whitespace-nowrap">
                      {formatVND(Math.round(avg))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-100/95 backdrop-blur-xs border-t-2 border-gray-300 font-black">
              <tr>
                <td className="py-3.5 px-4 text-gray-800">Tổng</td>
                <td className="py-3.5 px-4 text-right text-gray-800">
                  {sorted.reduce((s, r) => s + r.orders, 0).toLocaleString("vi-VN")}
                </td>
                <td className="py-3.5 px-4 text-right text-[#D35400]">
                  {formatVND(sorted.reduce((s, r) => s + r.revenue, 0))}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-600">
                  {formatVND(
                    Math.round(
                      sorted.reduce((s, r) => s + r.revenue, 0) /
                        Math.max(
                          sorted.reduce((s, r) => s + r.orders, 0),
                          1,
                        ),
                    ),
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
