"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Utensils } from "lucide-react";
import type { PopularDish } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PopularDishesChartProps {
  data: PopularDish[] | undefined;
  loading: boolean;
}

const CustomXAxisTick = (props: { x?: number; y?: number; payload?: { value: string } }) => {
  const { x = 0, y = 0, payload } = props;
  const val = payload?.value || "";
  const displayVal = val.length > 20 ? val.slice(0, 20) + "..." : val;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-6}
        dy={16}
        textAnchor="end"
        fill="#4B5563"
        fontSize={11}
        fontWeight={700}
        transform="rotate(-30)"
      >
        {displayVal}
      </text>
    </g>
  );
};

export function PopularDishesChart({ data, loading }: PopularDishesChartProps) {
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
          <Utensils className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Món ăn bán chạy</h2>
        </div>
        <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
          <Utensils className="w-12 h-12 text-gray-300" />
          <p className="text-lg font-bold text-gray-400 mt-4">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10)
    .map((d) => ({
      fullName: d.dishName,
      name: d.dishName,
      "Số lượng": d.totalQuantity,
      "Doanh thu": d.revenue,
    }));

  const maxQuantity = Math.max(...chartData.map((d) => d["Số lượng"]));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Utensils className="w-6 h-6 text-[#D35400]" />
          <h2 className="text-2xl font-black text-gray-900">Món ăn bán chạy</h2>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60 self-start sm:self-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#F39C12] inline-block shadow-2xs" />
            Bán chạy nhất
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#D35400] inline-block shadow-2xs" />
            Các món khác
          </span>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 25, left: 25, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={<CustomXAxisTick />}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={70}
            />
            <YAxis
              type="number"
              tick={{ fontSize: 11, fontWeight: 600, fill: "#9CA3AF" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullName || label;
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "Doanh thu") return [formatVND(v), "Doanh thu"];
                return [`${v} phần`, "Số lượng"];
              }}
            />
            <Bar dataKey="Số lượng" radius={[8, 8, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => {
                const isTop1 = entry["Số lượng"] === maxQuantity && maxQuantity > 0;
                return <Cell key={`cell-${index}`} fill={isTop1 ? "#F39C12" : "#D35400"} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
