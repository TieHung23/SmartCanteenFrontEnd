"use client";

import { useEffect, useState, useMemo } from "react";
import { StatsGrid } from "./_components/stats-grid";
import { AlertTriangle, Cpu, RefreshCw } from "lucide-react";
import apiClient from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useGlobalSearch } from "@/lib/stores/use-search";

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

  const globalQuery = useGlobalSearch((s) => s.query);

  const filteredLiveOrders = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return liveOrders;
    return liveOrders.filter((o) => {
      const id = (o.id || "").toLowerCase();
      const name = (o.userName || "").toLowerCase();
      const itemsStr = (o.items || [])
        .map((i) => i.dishName || "")
        .join(" ")
        .toLowerCase();
      return id.includes(q) || name.includes(q) || itemsStr.includes(q);
    });
  }, [liveOrders, globalQuery]);

  const filteredRobots = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return robots;
    return robots.filter((r) => {
      const code = (r.code || "").toLowerCase();
      const orderId = (r.currentOrderId || "").toLowerCase();
      const status = (r.status || "").toLowerCase();
      return code.includes(q) || orderId.includes(q) || status.includes(q);
    });
  }, [robots, globalQuery]);

  const handleManualFulfillment = async (_robotId: string, orderId?: string) => {
    if (!orderId) return;
    try {
      await apiClient.post(`/api/staff/orders/${orderId}/transitions`, {
        targetStatus: "Completed",
        note: "Robot gặp sự cố giữa chừng. Nhân viên phục vụ thủ công hoàn tất phần món còn lại.",
      });
      toast({
        title: "Xử lý thủ công thành công",
        description: `Đơn hàng #${orderId.slice(0, 8)} đã được chuyển sang Trạng thái Hoàn thành.`,
      });
      fetchOperationData();
    } catch {
      toast({
        title: "Lỗi hệ thống",
        description: "Không thể cập nhật trạng thái đơn hàng.",
      });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Trung Tâm Điều Hành</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Giám sát, phân phối thực phẩm và xử lý sự cố thời gian thực
          </p>
        </div>
        <button
          onClick={fetchOperationData}
          className="inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base px-6 py-3 rounded-xl shadow-sm transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              Đơn Hàng Đang Chế Biến
            </h2>
            <span className="text-sm bg-gray-100 text-gray-600 font-semibold px-3 py-1.5 rounded-full">
              {filteredLiveOrders.length} đơn
            </span>
          </div>

          {filteredLiveOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-base font-medium">
              {globalQuery.trim()
                ? "Không tìm thấy đơn hàng nào khớp"
                : "Hiện không có đơn hàng nào trong hàng đợi"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLiveOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-gray-900">
                        #{order.id?.slice(0, 8)}
                      </span>
                      <span className="text-sm text-gray-400">·</span>
                      <span className="text-base font-semibold text-gray-800">
                        {order.userName || "Sinh viên"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {order.items
                        ?.map((i) => `${i.dishName || "Món ăn"} x${i.quantity}`)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-lg font-bold text-[#FF4C24]">
                      {order.totalPrice?.toLocaleString()} P
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-5">
              <Cpu className="w-6 h-6 text-gray-600" />
              Robot
            </h2>
            {filteredRobots.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 font-medium">
                {globalQuery.trim() ? "Không tìm thấy robot nào khớp" : "Không có robot nào"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRobots.map((bot) => (
                  <div
                    key={bot.id}
                    className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-800">{bot.code}</span>
                      <span
                        className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                          bot.status === "Serving"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {bot.status === "Serving" ? "Đang hoạt động" : "Lỗi!"}
                      </span>
                    </div>

                    {bot.status === "MidOrderFailure" && (
                      <div className="bg-red-100/70 border border-red-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Sự cố đơn #{bot.currentOrderId}
                        </p>
                        <button
                          onClick={() => handleManualFulfillment(bot.id, bot.currentOrderId)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl transition shadow-xs"
                        >
                          Tiếp quản thủ công
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
