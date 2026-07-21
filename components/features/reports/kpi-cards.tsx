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
      cardBg: "bg-blue-50/60",
      cardBorder: "border-blue-100",
      iconBg: "bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      title: "Doanh thu",
      value: data ? formatVND(data.totalRevenue) : "—",
      change: data ? formatPercent(data.revenueChange) : null,
      icon: Coins,
      changePositive: data ? data.revenueChange >= 0 : true,
      cardBg: "bg-emerald-50/60",
      cardBorder: "border-emerald-100",
      iconBg: "bg-emerald-100 border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      title: "Tỷ lệ hoàn tiền",
      value: data ? `${data.refundRate.toFixed(1)}%` : "—",
      change: data ? formatPercent(data.refundChange) : null,
      icon: TrendingUp,
      changePositive: data ? data.refundChange <= 0 : true,
      cardBg: "bg-rose-50/60",
      cardBorder: "border-rose-100",
      iconBg: "bg-rose-100 border-rose-200",
      iconColor: "text-rose-600",
    },
    {
      title: "Món bán chạy",
      value: data ? data.topDish : "—",
      icon: Utensils,
      cardBg: "bg-orange-50/60",
      cardBorder: "border-orange-100",
      iconBg: "bg-orange-100 border-orange-200",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.cardBg} rounded-2xl border ${card.cardBorder} p-6 shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                {card.title}
              </p>
              <p
                className={`font-extrabold text-gray-900 ${card.title === "Món bán chạy" ? "text-xl truncate" : "text-3xl"}`}
              >
                {loading ? (
                  <span className="inline-block w-20 h-8 bg-gray-200 rounded-lg animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
              {card.change && (
                <p
                  className={`text-sm font-bold mt-1 ${
                    card.changePositive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {card.change} so với kỳ trước
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${card.iconBg} ${card.iconColor}`}
            >
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
