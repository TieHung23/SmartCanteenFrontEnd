"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle2, AlertOctagon, type LucideIcon } from "lucide-react";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface StatsItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
}

interface OrderItem {
  createdAt: string;
  status: number;
}

const DEFAULT_STATS: StatsItem[] = [
  {
    label: "Tổng đơn trong ngày",
    value: "—",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-100",
    cardBg: "bg-blue-50/60",
    cardBorder: "border-blue-100",
  },
  {
    label: "Đơn đang chờ",
    value: "—",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-100",
    cardBg: "bg-amber-50/60",
    cardBorder: "border-amber-100",
  },
  {
    label: "Sẵn sàng nhận món",
    value: "—",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    cardBg: "bg-emerald-50/60",
    cardBorder: "border-emerald-100",
  },
  {
    label: "Đơn gặp sự cố",
    value: "—",
    icon: AlertOctagon,
    color: "text-rose-600",
    bg: "bg-rose-100",
    cardBg: "bg-rose-50/60",
    cardBorder: "border-rose-100",
  },
];

export function StatsGrid() {
  const [stats, setStats] = useState<StatsItem[]>(DEFAULT_STATS);

  useEffect(() => {
    apiClient
      .get<{ value?: { items?: OrderItem[] } }>(API_ENDPOINTS.ORDER.LIST, {
        params: { pageNumber: 1, pageSize: 200 },
      })
      .then((res) => {
        const data = res as { value?: { items?: OrderItem[] } };
        const items = data?.value?.items || [];
        const today = new Date().toDateString();
        const todayOrders = items.filter((o) => new Date(o.createdAt).toDateString() === today);

        setStats([
          {
            label: "Tổng đơn trong ngày",
            value: String(todayOrders.length),
            icon: ClipboardList,
            color: "text-blue-600",
            bg: "bg-blue-100",
            cardBg: "bg-blue-50/60",
            cardBorder: "border-blue-100",
          },
          {
            label: "Đơn đang chờ",
            value: String(todayOrders.filter((o) => o.status === 0).length),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100",
            cardBg: "bg-amber-50/60",
            cardBorder: "border-amber-100",
          },
          {
            label: "Sẵn sàng nhận món",
            value: String(todayOrders.filter((o) => o.status === 1).length),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
            cardBg: "bg-emerald-50/60",
            cardBorder: "border-emerald-100",
          },
          {
            label: "Đơn gặp sự cố",
            value: String(todayOrders.filter((o) => o.status === 7).length),
            icon: AlertOctagon,
            color: "text-rose-600",
            bg: "bg-rose-100",
            cardBg: "bg-rose-50/60",
            cardBorder: "border-rose-100",
          },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.cardBg} rounded-2xl border ${stat.cardBorder} p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between`}
        >
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-extrabold text-gray-900">{stat.value}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
          >
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
