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
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Table2 className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Chi tiết doanh thu</h2>
        <span className="text-sm font-semibold text-gray-400 ml-auto">{data.length} ngày</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Ngày
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Đơn hàng
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                Doanh thu
              </th>
              <th className="text-right py-3 px-2 font-black text-gray-400 uppercase tracking-wider text-xs">
                TB/đơn
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const d = new Date(row.date);
              const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
              const avg = row.orders > 0 ? row.revenue / row.orders : 0;
              return (
                <tr
                  key={row.date}
                  className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors"
                >
                  <td className="py-3 px-2 font-bold text-gray-700">{dateStr}</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-700">
                    {row.orders.toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-[#D35400]">
                    {formatVND(row.revenue)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-gray-500">
                    {formatVND(Math.round(avg))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="py-3 px-2 font-black text-gray-700">Tổng</td>
              <td className="py-3 px-2 text-right font-black text-gray-700">
                {sorted.reduce((s, r) => s + r.orders, 0).toLocaleString("vi-VN")}
              </td>
              <td className="py-3 px-2 text-right font-black text-[#D35400]">
                {formatVND(sorted.reduce((s, r) => s + r.revenue, 0))}
              </td>
              <td className="py-3 px-2 text-right font-black text-gray-500">
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
  );
}
