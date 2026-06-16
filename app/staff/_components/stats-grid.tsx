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
}

interface OrderItem {
  createdAt: string;
  status: number;
}

const DEFAULT_STATS: StatsItem[] = [
  {
    label: "Tổng Đơn Trong Ngày",
    value: "—",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Đơn Đang Chờ (Pending)",
    value: "—",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Sẵn Sàng Nhận Món",
    value: "—",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Đơn Gặp Sự Cố (Failed)",
    value: "—",
    icon: AlertOctagon,
    color: "text-rose-600",
    bg: "bg-rose-50",
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
            label: "Tổng Đơn Trong Ngày",
            value: String(todayOrders.length),
            icon: ClipboardList,
            color: "text-blue-600",
            bg: "bg-blue-100/80",
          },
          {
            label: "Đơn Đang Chờ (Pending)",
            value: String(todayOrders.filter((o) => o.status === 0).length),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100/80",
          },
          {
            label: "Sẵn Sàng Nhận Món",
            value: String(todayOrders.filter((o) => o.status === 1 || o.status === 5).length),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-100/80",
          },
          {
            label: "Đơn Gặp Sự Cố (Failed)",
            value: String(todayOrders.filter((o) => o.status === 8).length),
            icon: AlertOctagon,
            color: "text-rose-600",
            bg: "bg-rose-100/80",
          },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-200 rounded-2xl p-7 flex items-center gap-6 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div
            className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}
          >
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-4xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-base font-medium text-gray-500 leading-tight">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
