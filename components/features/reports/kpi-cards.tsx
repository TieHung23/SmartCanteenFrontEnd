"use client";

import { Coins, Receipt, TrendingUp, Utensils } from "lucide-react";
import type { DashboardSummary } from "@/types/report.types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

interface KpiCardsProps {
  data: DashboardSummary | undefined;
  loading: boolean;
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  const cards = [
    {
      title: "Đơn hàng",
      value: data ? data.totalOrders.toLocaleString("vi-VN") : "—",
      change: data ? formatPercent(data.orderChange) : null,
      icon: Receipt,
      changePositive: data ? data.orderChange >= 0 : true,
    },
    {
      title: "Doanh thu",
      value: data ? formatVND(data.totalRevenue) : "—",
      change: data ? formatPercent(data.revenueChange) : null,
      icon: Coins,
      changePositive: data ? data.revenueChange >= 0 : true,
    },
    {
      title: "Tỷ lệ hoàn tiền",
      value: data ? `${data.refundRate.toFixed(1)}%` : "—",
      change: data ? formatPercent(data.refundChange) : null,
      icon: TrendingUp,
      changePositive: data ? data.refundChange <= 0 : true,
    },
    {
      title: "Món bán chạy",
      value: data ? data.topDish : "—",
      icon: Utensils,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                {card.title}
              </p>
              <p
                className={`font-black text-gray-900 mt-2 ${card.title === "Món bán chạy" ? "text-xl truncate" : "text-3xl"}`}
              >
                {loading ? (
                  <span className="inline-block w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
              {card.change && (
                <p
                  className={`text-sm font-bold mt-2 ${
                    card.changePositive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {card.change} so với kỳ trước
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shrink-0">
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
