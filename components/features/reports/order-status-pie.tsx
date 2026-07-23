"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { OrderStats } from "@/types/report.types";

const ORDER_STATUS_COLORS: Record<number, string> = {
  0: "#F59E0B", // Pending - Amber
  1: "#10B981", // ReadyForPickup - Emerald
  2: "#059669", // Completed - Green
  3: "#EF4444", // Cancelled - Red
  4: "#3B82F6", // Preparing - Blue
  7: "#6B7280", // Expired - Gray
};

interface OrderStatusPieProps {
  data: OrderStats[];
}

export function OrderStatusPie({ data }: OrderStatusPieProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.map((s) => ({ name: s.label, value: s.count }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] ?? "#9CA3AF"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value: unknown) => [Number(value).toLocaleString("vi-VN"), "Số lượng"]}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-sm font-semibold text-gray-700">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
