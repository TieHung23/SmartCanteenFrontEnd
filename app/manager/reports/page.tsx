"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import { toast } from "sonner";
import { BarChart3, Link as LinkIcon, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { orderService } from "@/services/order.service";
import { refundService } from "@/services/refund.service";
import { DateRangeFilter } from "@/components/features/reports/date-range-filter";
import { KpiCards } from "@/components/features/reports/kpi-cards";
import { RevenueChart } from "@/components/features/reports/revenue-chart";
import { PopularDishesChart } from "@/components/features/reports/popular-dishes-chart";
import { RefundStatsCard } from "@/components/features/reports/refund-stats-card";
import { RevenueTable } from "@/components/features/reports/revenue-table";
import { ExportButton } from "@/components/features/reports/export-button";
import type {
  DateRange,
  DashboardSummary,
  RevenueDataPoint,
  PopularDish,
  RefundStats,
} from "@/types/report.types";
import type { OrderListItem, OrderStatus } from "@/types/order.types";
import type { ManagerRefundListItem } from "@/types/refund.types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const now = new Date();
const defaultRange: DateRange = {
  from: format(startOfMonth(now), "yyyy-MM-dd"),
  to: format(now, "yyyy-MM-dd"),
};

const reportLinks = [
  { label: "Ca phục vụ", href: "/manager/sessions" },
  { label: "Yêu cầu hoàn tiền", href: "/manager/refunds" },
  { label: "Thiết lập thực đơn", href: "/manager/menu" },
];

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  0: "Chờ xác nhận",
  1: "Sẵn sàng",
  2: "Hoàn thành",
  3: "Đã huỷ",
  4: "Đang chuẩn bị",
  7: "Quá hạn",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  "0": "#F59E0B",
  "1": "#10B981",
  "2": "#059669",
  "3": "#EF4444",
  "4": "#3B82F6",
  "7": "#6B7280",
};

// ── Helpers ──

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function previousRange(range: DateRange): DateRange {
  const start = new Date(range.from);
  const end = new Date(range.to);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  return {
    from: format(prevStart, "yyyy-MM-dd"),
    to: format(prevEnd, "yyyy-MM-dd"),
  };
}

function computeDashboard(
  orders: OrderListItem[],
  prevOrders: OrderListItem[],
  refunds: ManagerRefundListItem[],
): DashboardSummary {
  const active = orders.filter((o) => o.status !== 3);
  const totalOrders = orders.length;
  const totalRevenue = active.reduce((s, o) => s + o.totalPrice, 0);
  const prevActive = prevOrders.filter((o) => o.status !== 3);
  const prevRevenue = prevActive.reduce((s, o) => s + o.totalPrice, 0);
  const prevCount = prevOrders.length;

  const refunded = refunds.filter((r) => r.status === "Approved");
  const refundAmount = refunded.reduce((s, r) => s + r.refundAmount, 0);
  const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;

  const topDish = "—";

  const orderChange = prevCount > 0 ? ((totalOrders - prevCount) / prevCount) * 100 : 0;
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const refundChange = 0;

  return {
    totalOrders,
    totalRevenue,
    refundRate,
    topDish,
    orderChange: Math.round(orderChange * 10) / 10,
    revenueChange: Math.round(revenueChange * 10) / 10,
    refundChange,
  };
}

function computeRevenue(orders: OrderListItem[]): RevenueDataPoint[] {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    if (o.status === 3) continue;
    const day = dateOnly(o.createdAtUtc);
    const entry = map.get(day) ?? { revenue: 0, orders: 0 };
    entry.revenue += o.totalPrice;
    entry.orders += 1;
    map.set(day, entry);
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function computeOrderStats(orders: OrderListItem[]) {
  const count: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const o of orders) count[o.status] = (count[o.status] ?? 0) + 1;
  return (Object.entries(count) as [string, number][])
    .filter(([, c]) => c > 0)
    .map(([s, c]) => ({
      status: s,
      label: ORDER_STATUS_LABEL[Number(s) as OrderStatus],
      count: c,
    }));
}

function computeRefundStats(refunds: ManagerRefundListItem[]): RefundStats {
  const totalRefunds = refunds.length;
  const totalRefundAmount = refunds.reduce((s, r) => s + r.refundAmount, 0);
  const approvedRefunds = refunds.filter((r) => r.status === "Approved").length;
  const rejectedRefunds = refunds.filter((r) => r.status === "Rejected").length;
  const pendingRefunds = refunds.filter((r) => r.status === "Pending").length;
  return { totalRefunds, totalRefundAmount, approvedRefunds, rejectedRefunds, pendingRefunds };
}

const ITEMS_PER_PAGE = 500;

function inRange(iso: string, from: string, to: string): boolean {
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}

// ── Page ──

export default function ManagerReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const prevRange = useMemo(() => previousRange(dateRange), [dateRange]);

  // Fetch orders — không gửi date params lên BE, filter client-side
  const allOrdersQuery = useQuery({
    queryKey: ["orders-report"],
    queryFn: () => orderService.getAll({ pageSize: ITEMS_PER_PAGE }),
    staleTime: 30_000,
    retry: 2,
  });

  const allRefundsQuery = useQuery({
    queryKey: ["refunds-report"],
    queryFn: () => refundService.managerList({ pageSize: ITEMS_PER_PAGE }),
    staleTime: 30_000,
    retry: 2,
  });

  // Filter client-side theo date range
  const allOrders = useMemo(() => allOrdersQuery.data?.items ?? [], [allOrdersQuery.data]);
  const orders = useMemo(
    () => allOrders.filter((o) => inRange(o.createdAtUtc, dateRange.from, dateRange.to)),
    [allOrders, dateRange],
  );
  const prevOrders = useMemo(
    () => allOrders.filter((o) => inRange(o.createdAtUtc, prevRange.from, prevRange.to)),
    [allOrders, prevRange],
  );

  const allRefunds = useMemo(() => allRefundsQuery.data?.items ?? [], [allRefundsQuery.data]);
  const refunds = useMemo(
    () => allRefunds.filter((r) => inRange(r.createdAtUtc, dateRange.from, dateRange.to)),
    [allRefunds, dateRange],
  );

  // Lấy chi tiết từng order để biết items (món ăn)
  const orderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const dishesQuery = useQuery({
    queryKey: ["order-dishes", ...orderIds],
    queryFn: async (): Promise<PopularDish[]> => {
      const BATCH = 20;
      const map = new Map<string, PopularDish>();
      for (let i = 0; i < orderIds.length; i += BATCH) {
        const batch = orderIds.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map((id) => orderService.getOrderById(id)));
        for (const r of results) {
          if (r.status !== "fulfilled") continue;
          for (const item of r.value.items) {
            const existing = map.get(item.dishId);
            const revenue = item.unitPrice * item.quantity;
            if (existing) {
              existing.totalOrders += 1;
              existing.totalQuantity += item.quantity;
              existing.revenue += revenue;
            } else {
              map.set(item.dishId, {
                dishId: item.dishId,
                dishName: item.dishName ?? "(không tên)",
                totalOrders: 1,
                totalQuantity: item.quantity,
                revenue,
              });
            }
          }
        }
      }
      return Array.from(map.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);
    },
    enabled: orderIds.length > 0 && orderIds.length <= 200,
    staleTime: 60_000,
    retry: 1,
  });

  const popularDishes = dishesQuery.data;

  const isLoading = allOrdersQuery.isLoading || allRefundsQuery.isLoading || dishesQuery.isLoading;
  const hasError = allOrdersQuery.isError || allRefundsQuery.isError;

  const dashboard = useMemo(
    () => computeDashboard(orders, prevOrders, refunds),
    [orders, prevOrders, refunds],
  );
  const revenue = useMemo(() => computeRevenue(orders), [orders]);
  const orderStats = useMemo(() => computeOrderStats(orders), [orders]);
  const refundStats = useMemo(() => computeRefundStats(refunds), [refunds]);

  useEffect(() => {
    if (hasError) {
      const msg =
        allOrdersQuery.error instanceof Error
          ? allOrdersQuery.error.message
          : "Không thể tải dữ liệu báo cáo";
      toast.error(msg);
    }
  }, [hasError, allOrdersQuery.error]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Báo cáo doanh thu</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Báo cáo về khối lượng đơn hàng, doanh thu, hoàn tiền và hiệu suất thực đơn.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasError && (
            <button
              onClick={() => {
                allOrdersQuery.refetch();
                allRefundsQuery.refetch();
              }}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
          )}
          <ExportButton
            dateRange={dateRange}
            dashboard={dashboard}
            revenue={revenue}
            popularDishes={popularDishes}
            orderStats={orderStats}
            refundStats={refundStats}
            disabled={isLoading}
          />
        </div>
      </div>

      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-600">
            Một số dữ liệu không thể tải được. Kiểm tra kết nối hoặc nhấn &quot;Tải lại&quot;.
          </p>
        </div>
      )}

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <KpiCards data={dashboard} loading={isLoading} />

      <RevenueChart data={revenue} loading={allOrdersQuery.isLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PopularDishesChart data={popularDishes} loading={dishesQuery.isLoading} />
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#D35400]" />
            <h2 className="text-2xl font-black text-gray-900">Đơn hàng theo trạng thái</h2>
          </div>
          {allOrdersQuery.isLoading ? (
            <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orderStats.length === 0 ? (
            <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
              <BarChart3 className="w-12 h-12 text-gray-300" />
              <p className="text-lg font-bold text-gray-400 mt-4">Chưa có đơn hàng</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStats.map((s) => ({ name: s.label, value: s.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStats.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={ORDER_STATUS_COLORS[entry.status] ?? "#9CA3AF"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value) => [Number(value).toLocaleString("vi-VN"), "Số lượng"]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-sm font-semibold text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RefundStatsCard
          data={refundStats}
          loading={allRefundsQuery.isLoading}
          error={allRefundsQuery.isError}
          onRetry={() => allRefundsQuery.refetch()}
        />
        <RevenueTable
          data={revenue}
          loading={allOrdersQuery.isLoading}
          error={allOrdersQuery.isError}
          onRetry={() => allOrdersQuery.refetch()}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        {reportLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-5 py-3 bg-white text-gray-600 hover:text-[#D35400] rounded-2xl border border-gray-100 hover:border-orange-200 text-sm font-black transition-all shadow-sm inline-flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
