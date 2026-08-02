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
import { parseISO, eachDayOfInterval, format as formatDate, isValid } from "date-fns";
import type { RevenueDataPoint, DateRange } from "@/types/report.types";

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
  dateRange?: DateRange;
}

function processChartData(
  rawData: RevenueDataPoint[] | undefined,
  dateRange?: DateRange,
): RevenueDataPoint[] {
  if (!rawData) return [];
  if (!dateRange || !dateRange.from || !dateRange.to) return rawData;

  try {
    const startDate = parseISO(dateRange.from);
    const endDate = parseISO(dateRange.to);

    if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
      return rawData;
    }

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const dataMap = new Map<string, RevenueDataPoint>();

    rawData.forEach((item) => {
      if (item.date) {
        const key = item.date.substring(0, 10);
        dataMap.set(key, item);
      }
    });

    return allDays.map((d) => {
      const key = formatDate(d, "yyyy-MM-dd");
      const existing = dataMap.get(key);
      return {
        date: key,
        revenue: existing ? existing.revenue : 0,
        orders: existing ? existing.orders : 0,
      };
    });
  } catch {
    return rawData;
  }
}

export function RevenueChart({ data, loading, dateRange }: RevenueChartProps) {
  const chartData = processChartData(data, dateRange);

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

  if (!chartData || chartData.length === 0) {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Doanh thu theo thời gian</h2>
        </div>
        {dateRange && (
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            {chartData.length} ngày
          </span>
        )}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              minTickGap={20}
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
              tick={{ fontSize: 11, fontWeight: 600, fill: "#D35400" }}
              tickLine={false}
              axisLine={false}
              domain={[
                0,
                (dataMax: number) => (dataMax === 0 ? 100000 : Math.ceil(dataMax * 1.15)),
              ]}
              tickFormatter={(val: number) => {
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M đ`;
                if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K đ`;
                return `${val} đ`;
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fontWeight: 600, fill: "#2563EB" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, (dataMax: number) => (dataMax === 0 ? 5 : Math.max(dataMax + 1, 5))]}
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
              dot={{ fill: "#D35400", r: chartData.length > 20 ? 2 : 4 }}
              activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: "#3B82F6", r: chartData.length > 20 ? 2 : 4 }}
              activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
