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
import type { SessionDetailOrderTrendItem } from "@/types/report.types";

function formatVND(amount: number): string {
  if (!amount) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

function formatTimeLabel(timeBucket: string): string {
  if (!timeBucket) return "";
  if (timeBucket.includes("T")) {
    const d = new Date(timeBucket);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${mins}`;
    }
  }
  return timeBucket;
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
    const displayLabel = formatTimeLabel(String(label ?? ""));

    return (
      <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xl text-sm space-y-2.5 min-w-[190px]">
        <p className="font-extrabold text-gray-800 border-b border-gray-100 pb-1.5 flex items-center justify-between">
          <span>Khung giờ</span>
          <span className="text-[#D35400] font-black">{displayLabel}</span>
        </p>
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
                {isRevenue ? formatVND(item.value) : `${item.value} đơn`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

interface SessionTrendChartProps {
  data: SessionDetailOrderTrendItem[] | undefined;
  loading?: boolean;
}

export function SessionTrendChart({ data, loading }: SessionTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-5 h-5 rounded-md bg-gray-200 animate-pulse" />
          <div className="h-6 w-52 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <TrendingUp className="w-5 h-5 text-[#D35400]" />
          <h2 className="text-xl font-black text-gray-900">Xu hướng đặt món 30 phút</h2>
        </div>
        <div className="h-72 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-400">Chưa có dữ liệu xu hướng đặt món</p>
        </div>
      </div>
    );
  }

  // Map data with formatted labels for XAxis
  const chartData = data.map((item) => ({
    ...item,
    formattedTime: formatTimeLabel(item.timeBucket),
  }));

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#D35400]" />
          <h2 className="text-xl font-black text-gray-900">Xu hướng đặt món 30 phút</h2>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-150">
          {chartData.length} khung giờ
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 11, fontWeight: 700, fill: "#4b5563" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fontWeight: 700, fill: "#2563eb" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]}
              tickFormatter={(val: number) => `${val}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fontWeight: 700, fill: "#D35400" }}
              tickLine={false}
              axisLine={false}
              domain={[0, (dataMax: number) => (dataMax === 0 ? 50000 : Math.ceil(dataMax * 1.15))]}
              tickFormatter={(val: number) => {
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                return `${val}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => {
                return value === "orders" ? "Số đơn (đơn)" : "Doanh thu (đ)";
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="orders"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ fill: "#2563eb", r: 4 }}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#D35400"
              strokeWidth={3}
              dot={{ fill: "#D35400", r: 4 }}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
