"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { RevenueDataPoint } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const parts = label ? String(label).split("-") : [];
    const dateStr =
      parts.length === 3 ? `Ngày ${parts[2]}/${parts[1]}/${parts[0]}` : String(label ?? "");

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xl text-sm space-y-2.5 min-w-[200px]">
        <p className="font-extrabold text-gray-800 border-b border-gray-100 pb-1.5">{dateStr}</p>
        {payload.map((item) => {
          const isRevenue = item.dataKey === "revenue";
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 font-bold text-gray-600">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                {isRevenue ? "Doanh thu" : "Đơn hàng"}
              </span>
              <span className={`font-black ${isRevenue ? "text-[#D35400]" : "text-blue-600"}`}>
                {isRevenue ? formatVND(item.value) : `${item.value.toLocaleString("vi-VN")} đơn`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

interface RevenueChartProps {
  data: RevenueDataPoint[] | undefined;
  loading: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Doanh thu theo thời gian</h2>
        </div>
        <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <TrendingUp className="w-12 h-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400 mt-4">Chưa có dữ liệu doanh thu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Doanh thu theo thời gian</h2>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(val: string) => {
                if (!val) return "";
                const parts = val.split("-");
                if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                return val;
              }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => {
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                return val.toString();
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(val: number) => `${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => {
                return value === "revenue" ? "Doanh thu (đ)" : "Đơn hàng (đơn)";
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#D35400"
              strokeWidth={2.5}
              dot={{ fill: "#D35400", r: 4 }}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
