"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  PieChart as PieIcon,
  BarChart2,
  Clock,
} from "lucide-react";
import { reportService } from "@/services/report.service";
import { OrderStatusPie } from "@/components/features/reports/order-status-pie";
import { PopularDishesChart } from "@/components/features/reports/popular-dishes-chart";
import type { SessionDetailReportData } from "@/types/report.types";
import { cn } from "@/lib/utils";

function formatDate(iso?: string) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount?: number) {
  if (!amount) return "0 đ";
  return amount.toLocaleString("vi-VN") + " đ";
}

const ORDER_STATUS_MAP: Record<number, string> = {
  0: "Chờ xử lý",
  1: "Sẵn sàng nhận",
  2: "Hoàn thành",
  3: "Đã hủy",
  4: "Đang chuẩn bị",
  7: "Hết hạn",
};

export default function SessionDetailReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const reportQuery = useQuery({
    queryKey: ["session-detail-report", sessionId],
    queryFn: async () => {
      try {
        return await reportService.getSessionDetail(sessionId);
      } catch (err) {
        console.error("Failed to load session detail report:", err);
        return null;
      }
    },
    staleTime: 30_000,
  });

  const data: SessionDetailReportData | null | undefined = reportQuery.data;
  const isLoading = reportQuery.isLoading;
  const isError = reportQuery.isError;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/manager/reports/sessions")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách báo cáo session
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">
            Đang tải báo cáo chi tiết ca phục vụ...
          </p>
        </div>
      ) : isError || !data ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-xs">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-gray-900">
            Không thể tải dữ liệu báo cáo chi tiết
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Hệ thống không tìm thấy hoặc chưa tạo dữ liệu phân tích chi tiết cho ca phục vụ này.
          </p>
          <button
            onClick={() => reportQuery.refetch()}
            className="px-5 py-2.5 bg-[#D35400] text-white rounded-xl font-bold text-sm hover:bg-[#b84900] transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* Header Metadata */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-gray-900">{data.session.sessionName}</h1>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                      data.session.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {data.session.isActive ? "Đang phục vụ" : "Đã kết thúc"}
                  </span>
                </div>
                {data.session.description && (
                  <p className="text-sm text-gray-500 italic">{data.session.description}</p>
                )}
              </div>
              <button
                onClick={() => reportQuery.refetch()}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shrink-0 self-start md:self-center"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { stage: "Mở đặt món", time: formatDate(data.session.availableForOrder) },
                { stage: "Chốt món", time: formatDate(data.session.finalizationDeadline) },
                { stage: "Giờ mở ca", time: formatDate(data.session.availableFrom) },
                { stage: "Giờ đóng ca", time: formatDate(data.session.availableTo) },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-1"
                >
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    {item.stage}
                  </p>
                  <p className="text-sm font-bold text-gray-800">{item.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-[#D35400]">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Doanh thu ca
                </span>
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {formatMoney(data.summary.totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 font-bold">
                Hoàn tiền: {formatMoney(data.summary.refundAmount)}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Tổng số đơn
                </span>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-gray-900">{data.summary.totalOrders} đơn</p>
              <p className="text-xs text-blue-600 font-bold">
                Hoàn thành: {data.summary.completedOrders} đơn
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-green-600">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Tỷ lệ hoàn thành
                </span>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {(data.summary.completionRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 font-bold">Đã phục vụ xong</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-red-500">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Tỷ lệ hủy / hoàn
                </span>
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-gray-900">
                {(data.summary.refundRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-red-500 font-bold">
                {data.summary.cancelledOrders} hủy · {data.summary.refundRequests} hoàn
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 30-min Order Trend */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <BarChart2 className="w-5 h-5 text-[#D35400]" />
                <h2 className="text-xl font-black text-gray-900">Xu hướng đặt món 30 phút</h2>
              </div>
              {!data.orderTrend || data.orderTrend.length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-12">
                  Chưa có dữ liệu theo khung giờ.
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {data.orderTrend.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                    >
                      <span className="font-bold text-sm text-gray-800">
                        <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                        {slot.timeBucket}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {slot.orders} đơn
                        </span>
                        <span className="text-xs font-black text-[#D35400] bg-orange-50 px-2.5 py-1 rounded-lg">
                          {formatMoney(slot.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Pie Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <PieIcon className="w-5 h-5 text-[#D35400]" />
                <h2 className="text-xl font-black text-gray-900">Phân bố đơn hàng</h2>
              </div>
              <div className="h-72">
                <OrderStatusPie data={data.orderStats || []} />
              </div>
            </div>
          </div>

          {/* Popular Dishes */}
          <PopularDishesChart data={data.popularDishes || []} loading={false} />

          {/* Recent 20 Orders Table */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-3">
              Danh sách đơn hàng gần đây ({data.recentOrders?.length || 0})
            </h2>

            {!data.recentOrders || data.recentOrders.length === 0 ? (
              <p className="text-gray-400 font-bold text-center py-8">Chưa có đơn hàng nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Số lượng</th>
                      <th className="py-3 px-4">Tổng tiền</th>
                      <th className="py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-bold">
                    {data.recentOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4 font-black text-gray-900">
                          #{order.orderId.slice(-6)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-gray-900">{order.customerName}</p>
                          <p className="text-xs text-gray-400 font-normal">{order.customerEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {formatDate(order.createdAtUtc)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-800">{order.itemCount} món</td>
                        <td className="py-3.5 px-4 text-[#D35400] font-black">
                          {formatMoney(order.totalPrice)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-black uppercase text-gray-700">
                            {ORDER_STATUS_MAP[order.status] || order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
