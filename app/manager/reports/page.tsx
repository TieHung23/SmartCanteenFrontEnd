"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import {
  BarChart3,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { reportService } from "@/services/report.service";
import { DateRangeFilter } from "@/components/features/reports/date-range-filter";
import { KpiCards } from "@/components/features/reports/kpi-cards";
import { RevenueChart } from "@/components/features/reports/revenue-chart";
import { PopularDishesChart } from "@/components/features/reports/popular-dishes-chart";
import { RevenueTable } from "@/components/features/reports/revenue-table";
import { SessionReportTable } from "@/components/features/reports/session-report-table";
import { OrderIssuesCard } from "@/components/features/reports/order-issues-card";
import { RefundStatsCard } from "@/components/features/reports/refund-stats-card";
import { RefundPolicyTable } from "@/components/features/reports/refund-policy-table";
import { ExportButton } from "@/components/features/reports/export-button";
import type { DateRange } from "@/types/report.types";

const now = new Date();
const defaultRange: DateRange = {
  from: format(startOfMonth(now), "yyyy-MM-dd"),
  to: format(now, "yyyy-MM-dd"),
};

type TabId = "overview" | "sessions" | "issues" | "refunds";

const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Tổng quan", icon: BarChart3 },
  { id: "sessions", label: "Ca phục vụ", icon: CalendarDays },
  { id: "issues", label: "Vấn đề đơn hàng", icon: XCircle },
  { id: "refunds", label: "Chính sách hoàn tiền", icon: ShieldCheck },
];

import { OrderStatusPie } from "@/components/features/reports/order-status-pie";

export default function ManagerReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const summaryQuery = useQuery({
    queryKey: ["report-summary", dateRange.from, dateRange.to],
    queryFn: () => reportService.getSummary({ from: dateRange.from, to: dateRange.to }),
    staleTime: 30_000,
    retry: 2,
  });

  const sessionsQuery = useQuery({
    queryKey: ["report-sessions", dateRange.from, dateRange.to],
    queryFn: () => reportService.getSessions({ from: dateRange.from, to: dateRange.to }),
    staleTime: 30_000,
    retry: 2,
  });

  const issuesQuery = useQuery({
    queryKey: ["report-issues", dateRange.from, dateRange.to],
    queryFn: () => reportService.getOrderIssues({ from: dateRange.from, to: dateRange.to }),
    staleTime: 30_000,
    retry: 2,
  });

  const refundPoliciesQuery = useQuery({
    queryKey: ["report-refund-policies", dateRange.from, dateRange.to],
    queryFn: () => reportService.getRefundPolicies({ from: dateRange.from, to: dateRange.to }),
    staleTime: 30_000,
    retry: 2,
  });

  const summary = summaryQuery.data;

  useEffect(() => {
    const hasError =
      summaryQuery.isError ||
      sessionsQuery.isError ||
      issuesQuery.isError ||
      refundPoliciesQuery.isError;
    if (hasError) {
      toast.error("Một số dữ liệu không thể tải được. Vui lòng thử lại.");
    }
  }, [
    summaryQuery.isError,
    sessionsQuery.isError,
    issuesQuery.isError,
    refundPoliciesQuery.isError,
  ]);

  const hasError =
    summaryQuery.isError ||
    sessionsQuery.isError ||
    issuesQuery.isError ||
    refundPoliciesQuery.isError;

  const refetchAll = () => {
    summaryQuery.refetch();
    sessionsQuery.refetch();
    issuesQuery.refetch();
    refundPoliciesQuery.refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Báo cáo</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Báo cáo tổng quan, ca phục vụ, vấn đề đơn hàng và chính sách hoàn tiền.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasError && (
            <button
              onClick={refetchAll}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
          )}
          <ExportButton
            dateRange={dateRange}
            summary={summary}
            sessions={sessionsQuery.data}
            issues={issuesQuery.data}
            refundPolicies={refundPoliciesQuery.data}
            disabled={summaryQuery.isLoading}
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

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-t-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-[#D35400] text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <KpiCards data={summary?.dashboard} loading={summaryQuery.isLoading} />
          <RevenueChart data={summary?.revenueTrend} loading={summaryQuery.isLoading} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PopularDishesChart data={summary?.popularDishes} loading={summaryQuery.isLoading} />
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-[#D35400]" />
                <h2 className="text-2xl font-black text-gray-900">Đơn hàng theo trạng thái</h2>
              </div>
              {summaryQuery.isLoading ? (
                <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !summary?.orderStats || summary.orderStats.length === 0 ? (
                <div className="h-80 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-gray-300" />
                  <p className="text-lg font-bold text-gray-400 mt-4">Chưa có đơn hàng</p>
                </div>
              ) : (
                <div className="h-80">
                  <OrderStatusPie data={summary.orderStats} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RefundStatsCard
              data={summary?.refundStats}
              loading={summaryQuery.isLoading}
              error={summaryQuery.isError}
              onRetry={() => summaryQuery.refetch()}
            />
            <RevenueTable
              data={summary?.revenueTrend}
              loading={summaryQuery.isLoading}
              error={summaryQuery.isError}
              onRetry={() => summaryQuery.refetch()}
            />
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <SessionReportTable
          data={sessionsQuery.data?.items}
          loading={sessionsQuery.isLoading}
          error={sessionsQuery.isError}
          onRetry={() => sessionsQuery.refetch()}
        />
      )}

      {activeTab === "issues" && (
        <OrderIssuesCard
          data={issuesQuery.data}
          loading={issuesQuery.isLoading}
          error={issuesQuery.isError}
          onRetry={() => issuesQuery.refetch()}
        />
      )}

      {activeTab === "refunds" && (
        <RefundPolicyTable
          data={refundPoliciesQuery.data?.items}
          loading={refundPoliciesQuery.isLoading}
          error={refundPoliciesQuery.isError}
          onRetry={() => refundPoliciesQuery.refetch()}
        />
      )}
    </div>
  );
}
