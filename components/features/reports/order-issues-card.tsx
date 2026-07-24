"use client";

import { AlertCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { OrderIssuesResponse } from "@/types/report.types";

const ISSUE_COLORS: Record<string, string> = {
  cancelled: "#EF4444",
  expired: "#6B7280",
  refund_requested: "#F59E0B",
};

interface OrderIssuesCardProps {
  data: OrderIssuesResponse | undefined;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function OrderIssuesCard({ data, loading, error, onRetry }: OrderIssuesCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <XCircle className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Vấn đề đơn hàng</h2>
        </div>
        <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <XCircle className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Vấn đề đơn hàng</h2>
        </div>
        <div className="h-80 rounded-3xl bg-red-50 border border-dashed border-red-200 flex flex-col items-center justify-center gap-3">
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

  if (!data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <XCircle className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Vấn đề đơn hàng</h2>
        </div>
        <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <XCircle className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const pieData = data.items.filter((i) => i.count > 0);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <XCircle className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Vấn đề đơn hàng</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-red-400 uppercase">Huỷ</p>
          <p className="text-2xl font-black text-red-500 mt-1">{data.cancelledOrders}</p>
          <p className="text-xs font-bold text-red-400">{data.cancelledRate.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">Quá hạn</p>
          <p className="text-2xl font-black text-gray-500 mt-1">{data.expiredOrders}</p>
          <p className="text-xs font-bold text-gray-400">{data.expiredRate.toFixed(1)}%</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-yellow-500 uppercase">Hoàn tiền</p>
          <p className="text-2xl font-black text-yellow-600 mt-1">{data.refundRequestedOrders}</p>
          <p className="text-xs font-bold text-yellow-500">{data.refundRequestRate.toFixed(1)}%</p>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData.map((i) => ({ name: i.label, value: i.count }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.type} fill={ISSUE_COLORS[entry.type] ?? "#9CA3AF"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [Number(value).toLocaleString("vi-VN"), "Số đơn"]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm font-semibold text-gray-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
