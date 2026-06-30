"use client";

import { AlertCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RefundStats } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

const REFUND_PIE_COLORS = ["#10B981", "#EF4444", "#F59E0B"];

interface RefundStatsCardProps {
  data: RefundStats | undefined;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function RefundStatsCard({ data, loading, error, onRetry }: RefundStatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-black text-gray-900">Hoàn tiền</h2>
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

  if (!data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Hoàn tiền</h2>
        </div>
        <div className="h-64 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <XCircle className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 mt-3">Chưa có dữ liệu hoàn tiền</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Đã duyệt", value: data.approvedRefunds },
    { name: "Từ chối", value: data.rejectedRefunds },
    { name: "Chờ duyệt", value: data.pendingRefunds },
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      label: "Tổng yêu cầu",
      value: data.totalRefunds.toLocaleString("vi-VN"),
      color: "text-gray-900",
    },
    {
      label: "Đã duyệt",
      value: data.approvedRefunds.toLocaleString("vi-VN"),
      color: "text-green-600",
    },
    {
      label: "Từ chối",
      value: data.rejectedRefunds.toLocaleString("vi-VN"),
      color: "text-red-500",
    },
    { label: "Tổng tiền", value: formatVND(data.totalRefundAmount), color: "text-[#D35400]" },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Hoàn tiền</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {pieData.length > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={REFUND_PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [Number(value).toLocaleString("vi-VN"), "Số lượng"]}
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
