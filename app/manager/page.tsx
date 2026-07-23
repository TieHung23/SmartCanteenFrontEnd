"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BarChart3, RefreshCw, ArrowRight, AlertCircle, Calendar } from "lucide-react";
import { reportService } from "@/services/report.service";
import { KpiCards } from "@/components/features/reports/kpi-cards";
import { RevenueChart } from "@/components/features/reports/revenue-chart";
import { PopularDishesChart } from "@/components/features/reports/popular-dishes-chart";
import { RefundStatsCard } from "@/components/features/reports/refund-stats-card";
import { OrderStatusPie } from "@/components/features/reports/order-status-pie";

export default function ManagerDashboard() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "dd/MM/yyyy");

  const summaryQuery = useQuery({
    queryKey: ["manager-dashboard-summary", todayStr],
    queryFn: () => reportService.getSummary({ from: todayStr, to: todayStr }),
    staleTime: 30_000,
    retry: 2,
  });

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading;
  const isError = summaryQuery.isError;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-gray-900">Bảng điều khiển</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#D35400] text-xs font-bold rounded-full border border-orange-100">
              <Calendar className="w-3.5 h-3.5" />
              Hôm nay: {todayDisplay}
            </span>
          </div>
          <p className="text-lg text-gray-500 mt-1.5">
            Tổng quan báo cáo doanh thu, chỉ số vận hành và hoạt động nhà ăn trong ngày.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => summaryQuery.refetch()}
            disabled={isLoading}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <Link
            href="/manager/reports"
            className="px-5 py-3 bg-[#D35400] text-white rounded-2xl text-sm font-black hover:bg-[#c04e00] transition-all shadow-sm flex items-center gap-2"
          >
            Báo cáo chi tiết
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-600">
              Không thể tải dữ liệu báo cáo hôm nay. Vui lòng thử lại.
            </p>
          </div>
          <button
            onClick={() => summaryQuery.refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* KPI Section */}
      <KpiCards data={summary?.dashboard} loading={isLoading} />

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart data={summary?.revenueTrend} loading={isLoading} />

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#D35400]" />
            <h2 className="text-2xl font-black text-gray-900">Đơn hàng theo trạng thái hôm nay</h2>
          </div>
          {isLoading ? (
            <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !summary?.orderStats || summary.orderStats.length === 0 ? (
            <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
              <BarChart3 className="w-12 h-12 text-gray-300" />
              <p className="text-lg font-bold text-gray-400 mt-4">Chưa có đơn hàng trong ngày</p>
            </div>
          ) : (
            <div className="h-80">
              <OrderStatusPie data={summary.orderStats} />
            </div>
          )}
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PopularDishesChart data={summary?.popularDishes} loading={isLoading} />
        <RefundStatsCard
          data={summary?.refundStats}
          loading={isLoading}
          error={isError}
          onRetry={() => summaryQuery.refetch()}
        />
      </div>
    </div>
  );
}
