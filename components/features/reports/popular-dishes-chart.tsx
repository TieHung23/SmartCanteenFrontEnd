"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
      name: d.dishName.length > 20 ? d.dishName.slice(0, 20) + "..." : d.dishName,
      "Số lượng": d.totalQuantity,
      "Doanh thu": d.revenue,
    }));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Utensils className="w-6 h-6 text-[#D35400]" />
        <h2 className="text-2xl font-black text-gray-900">Món ăn bán chạy</h2>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "Doanh thu") return [formatVND(v), "Doanh thu"];
                return [v, "Số lượng"];
              }}
            />
            <Bar dataKey="Số lượng" fill="#D35400" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
