"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type {
  SummaryReportResponse,
  SessionReportResponse,
  OrderIssuesResponse,
  RefundPolicyReportResponse,
} from "@/types/report.types";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  dateRange: { from: string; to: string };
  summary: SummaryReportResponse | undefined;
  sessions: SessionReportResponse | undefined;
  issues: OrderIssuesResponse | undefined;
  refundPolicies: RefundPolicyReportResponse | undefined;
  disabled?: boolean;
}

export function ExportButton({
  dateRange,
  summary,
  sessions,
  issues,
  refundPolicies,
  disabled,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (summary) {
      const dashData = [
        ["Chỉ số", "Giá trị"],
        ["Tổng đơn hàng", summary.dashboard.totalOrders],
        ["Doanh thu", summary.dashboard.totalRevenue],
        ["Tỷ lệ hoàn tiền", `${summary.dashboard.refundRate}%`],
        ["Món bán chạy", summary.dashboard.topDish],
        ["Khách mới", summary.dashboard.newCustomers],
        ["Khiếu nại", summary.dashboard.totalComplaints],
        ["Thay đổi đơn hàng", `${summary.dashboard.orderChange}%`],
        ["Thay đổi doanh thu", `${summary.dashboard.revenueChange}%`],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dashData), "Tổng quan");
    }

    if (summary?.revenueTrend && summary.revenueTrend.length > 0) {
      const revData = [
        ["Ngày", "Đơn hàng", "Doanh thu"],
        ...summary.revenueTrend.map((r) => [r.date, r.orders, r.revenue]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revData), "Doanh thu");
    }

    if (summary?.popularDishes && summary.popularDishes.length > 0) {
      const dishData = [
        ["Món ăn", "Số đơn", "Số lượng", "Doanh thu"],
        ...summary.popularDishes.map((d) => [
          d.dishName,
          d.totalOrders,
          d.totalQuantity,
          d.revenue,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dishData), "Món ăn bán chạy");
    }

    if (sessions?.items && sessions.items.length > 0) {
      const sessionData = [
        ["Ca", "Từ", "Đến", "Đơn", "Hoàn thành", "Tỷ lệ", "Doanh thu", "Hoàn tiền"],
        ...sessions.items.map((s) => [
          s.sessionName,
          s.availableFrom,
          s.availableTo,
          s.totalOrders,
          s.completedOrders,
          `${s.completionRate}%`,
          s.revenue,
          s.refundAmount,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sessionData), "Ca phục vụ");
    }

    if (issues) {
      const issueData = [
        ["Chỉ số", "Giá trị"],
        ["Tổng đơn", issues.totalOrders],
        ["Huỷ", issues.cancelledOrders],
        ["Quá hạn", issues.expiredOrders],
        ["Hoàn tiền", issues.refundRequestedOrders],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(issueData), "Vấn đề đơn");
    }

    if (refundPolicies?.items && refundPolicies.items.length > 0) {
      const refundData = [
        ["Chính sách", "Yêu cầu", "Duyệt", "Từ chối", "Tỷ lệ", "Số tiền"],
        ...refundPolicies.items.map((p) => [
          p.policyName,
          p.totalRequests,
          p.approvedRequests,
          p.rejectedRequests,
          `${p.approvalRate}%`,
          p.totalAmount,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(refundData), "Hoàn tiền");
    }

    const range = `${dateRange.from}_${dateRange.to}`;
    XLSX.writeFile(wb, `bao_cao_${range}.xlsx`);
    setOpen(false);
  };

  const exportCSV = () => {
    if (!summary?.revenueTrend || summary.revenueTrend.length === 0) return;

    const header = "Ngày,Đơn hàng,Doanh thu\n";
    const rows = summary.revenueTrend.map((r) => `${r.date},${r.orders},${r.revenue}`).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao_cao_doanh_thu_${dateRange.from}_${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="px-5 py-3 bg-[#D35400] text-white rounded-2xl text-sm font-black hover:bg-[#c04e00] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Xuất báo cáo
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-2xl border border-gray-200 shadow-lg p-2 min-w-[200px]">
            <button
              onClick={exportExcel}
              className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-orange-50 text-sm font-bold text-gray-700 transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Xuất Excel (.xlsx)
            </button>
            <button
              onClick={exportCSV}
              className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-orange-50 text-sm font-bold text-gray-700 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-500" />
              Xuất CSV (.csv)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
