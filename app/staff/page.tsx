"use client";

import { useEffect, useState } from "react";
import { StatsGrid } from "./_components/stats-grid";
import { AlertTriangle, Cpu, RefreshCw } from "lucide-react";
import apiClient from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

interface LiveOrder {
  id: string;
  userName?: string;
  items?: { dishName?: string; quantity?: number }[];
  totalPrice?: number;
}

interface Robot {
  id: string;
  code: string;
  status: string;
  currentOrderId?: string;
}

export default function StaffDashboardPage() {
  const { toast } = useToast();
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOperationData = () => {
    apiClient
      .get("/api/staff/orders?status=Processing&pageSize=5")
      .then((orderRes: unknown) => {
        const typedOrderRes = orderRes as { value?: { items?: LiveOrder[] } };
        setLiveOrders(typedOrderRes?.value?.items || []);
      })
      .catch((err: unknown) => console.error(err));

    apiClient
      .get("/api/staff/robots")
      .then((robotRes: unknown) => {
        const typedRobotRes = robotRes as { value?: Robot[] };
        setRobots(
          typedRobotRes?.value || [
            { id: "1", code: "ROBOT-ALPHA", status: "Serving", currentOrderId: "ORD-9872" },
            { id: "2", code: "ROBOT-BETA", status: "MidOrderFailure", currentOrderId: "ORD-5541" },
          ],
        );
      })
      .catch((err: unknown) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOperationData();
    const interval = setInterval(fetchOperationData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Xử lý khi Robot lỗi giữa đơn (Mid-order failure) -> Staff làm thủ công
  const handleManualFulfillment = async (_robotId: string, orderId: string) => {
    try {
      await apiClient.post(`/api/staff/orders/${orderId}/transitions`, {
        targetStatus: "Completed",
        note: "Robot gặp sự cố giữa chừng. Nhân viên phục vụ thủ công hoàn tất phần món còn lại.",
      });
      toast({
        title: "Xử lý thủ công thành công",
        description: `Đơn hàng #${orderId?.slice(0, 8)} đã được chuyển sang Trạng thái Hoàn thành.`,
      });
      fetchOperationData();
    } catch {
      toast({
        title: "Lỗi hệ thống",
        description: "Không thể cập nhật trạng thái đơn hàng.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-2">
      {/* Tiêu đề & Nút Refresh lớn */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Trung Tâm Điều Hành Nhà Ăn
          </h1>
          <p className="text-base text-gray-500 mt-1">
            Hệ thống giám sát, phân phối thực phẩm và xử lý sự cố thời gian thực.
          </p>
        </div>
        <button
          onClick={fetchOperationData}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới dữ liệu (Live)
        </button>
      </div>

      {/* Grid thống kê kích thước lớn */}
      <StatsGrid />

      {/* Layout chính: Bên trái là Live Queue, Bên phải là Trạng thái Robot & Thiết bị */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Khối Live Serving Queue */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Đơn hàng Đang Chế Biến / Phục Vụ Tại Quầy
            </h2>
            <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full">
              {liveOrders.length} Đơn hàng
            </span>
          </div>

          {liveOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Hiện không có đơn hàng nào trong hàng đợi chế biến.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {liveOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        #{order.id?.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-sm font-medium text-gray-700">
                        {order.userName || "Sinh viên"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Món ăn:{" "}
                      {order.items
                        ?.map((i) => `${i.dishName || "Món ăn"} x${i.quantity}`)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-sm font-semibold text-[#FF4C24] mr-2">
                      {order.totalPrice?.toLocaleString()}₫
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Khối Trạng thái Robot & Giám sát Sự cố Khẩn cấp */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-gray-600" />
              Trạng thái Cánh Tay Robot
            </h2>
            <div className="space-y-3">
              {robots.map((bot) => (
                <div
                  key={bot.id}
                  className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{bot.code}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        bot.status === "Serving"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {bot.status === "Serving" ? "Đang chạy ổn định" : "Lỗi Hệ Thống!"}
                    </span>
                  </div>

                  {bot.status === "MidOrderFailure" && (
                    <div className="bg-red-100/60 border border-red-200 rounded-md p-3 space-y-2">
                      <p className="text-xs text-red-800 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gặp sự cố khi đang ra món cho đơn #{bot.currentOrderId}
                      </p>
                      <button
                        onClick={() => handleManualFulfillment(bot.id, bot.currentOrderId)}
                        className="w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-1.5 rounded transition"
                      >
                        Tiếp quản thủ công & Hoàn thành đơn
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
