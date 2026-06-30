"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type {
  DashboardSummary,
  RevenueDataPoint,
  PopularDish,
  OrderStats,
  RefundStats,
} from "@/types/report.types";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  dateRange: { from: string; to: string };
  dashboard: DashboardSummary | undefined;
  revenue: RevenueDataPoint[] | undefined;
  popularDishes: PopularDish[] | undefined;
  orderStats: OrderStats[] | undefined;
  refundStats: RefundStats | undefined;
  disabled?: boolean;
}

export function ExportButton({
  dateRange,
  dashboard,
  revenue,
  popularDishes,
  orderStats,
  refundStats,
  disabled,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Dashboard
    if (dashboard) {
      const dashData = [
        ["Chỉ số", "Giá trị"],
        ["Tổng đơn hàng", dashboard.totalOrders],
        ["Doanh thu", dashboard.totalRevenue],
        ["Tỷ lệ hoàn tiền", `${dashboard.refundRate}%`],
        ["Món bán chạy", dashboard.topDish],
        ["Thay đổi đơn hàng", `${dashboard.orderChange}%`],
        ["Thay đổi doanh thu", `${dashboard.revenueChange}%`],
        ["Thay đổi hoàn tiền", `${dashboard.refundChange}%`],
      ];
      const sheet = XLSX.utils.aoa_to_sheet(dashData);
      XLSX.utils.book_append_sheet(wb, sheet, "Tổng quan");
    }

    // Sheet 2: Revenue
    if (revenue && revenue.length > 0) {
      const revData = [
        ["Ngày", "Đơn hàng", "Doanh thu"],
        ...revenue.map((r) => [r.date, r.orders, r.revenue]),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(revData);
      XLSX.utils.book_append_sheet(wb, sheet, "Doanh thu");
    }

    // Sheet 3: Popular Dishes
    if (popularDishes && popularDishes.length > 0) {
      const dishData = [
        ["Món ăn", "Số đơn", "Số lượng", "Doanh thu"],
        ...popularDishes.map((d) => [d.dishName, d.totalOrders, d.totalQuantity, d.revenue]),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(dishData);
      XLSX.utils.book_append_sheet(wb, sheet, "Món ăn bán chạy");
    }

    // Sheet 4: Order Stats
    if (orderStats && orderStats.length > 0) {
      const orderData = [["Trạng thái", "Số lượng"], ...orderStats.map((s) => [s.label, s.count])];
      const sheet = XLSX.utils.aoa_to_sheet(orderData);
      XLSX.utils.book_append_sheet(wb, sheet, "Đơn hàng");
    }

    // Sheet 5: Refund Stats
    if (refundStats) {
      const refundData = [
        ["Chỉ số", "Giá trị"],
        ["Tổng yêu cầu", refundStats.totalRefunds],
        ["Đã duyệt", refundStats.approvedRefunds],
        ["Từ chối", refundStats.rejectedRefunds],
        ["Chờ duyệt", refundStats.pendingRefunds],
        ["Tổng tiền hoàn", refundStats.totalRefundAmount],
      ];
      const sheet = XLSX.utils.aoa_to_sheet(refundData);
      XLSX.utils.book_append_sheet(wb, sheet, "Hoàn tiền");
    }

    const range = `${dateRange.from}_${dateRange.to}`;
    XLSX.writeFile(wb, `bao_cao_${range}.xlsx`);
    setOpen(false);
  };

  const exportCSV = () => {
    if (!revenue || revenue.length === 0) return;

    const header = "Ngày,Đơn hàng,Doanh thu\n";
    const rows = revenue.map((r) => `${r.date},${r.orders},${r.revenue}`).join("\n");
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
