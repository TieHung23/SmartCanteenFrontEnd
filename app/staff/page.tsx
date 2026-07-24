"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { StatsGrid } from "./_components/stats-grid";
import { Cpu, RefreshCw } from "lucide-react";
import { useGlobalSearch } from "@/lib/stores/use-search";
import { orderService } from "@/services/order.service";
import { sessionService } from "@/services/session.service";
import { robotArmService } from "@/services/robot-arm.service";
import type { OrderListItem } from "@/types/order.types";
import type { RobotArm } from "@/types/robot-arm.types";

export default function StaffDashboardPage() {
  const [liveOrders, setLiveOrders] = useState<OrderListItem[]>([]);
  const [robotArms, setRobotArms] = useState<RobotArm[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOperationData = () => {
    setLoading(true);
    Promise.all([
      orderService.getAll({ status: 0, pageSize: 10 }).catch(() => null),
      robotArmService.getList().catch(() => []),
    ])
      .then(async ([ordersRes, armsRes]) => {
        let orders = ordersRes?.items || [];
        if (orders.length === 0) {
          try {
            const activeSessions = await sessionService.getSessions({ pageSize: 10 });
            const currentSession =
              activeSessions.items.find(
                (s) => s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date()),
              ) || activeSessions.items[0];
            if (currentSession) {
              const sessionOrdersData = await orderService.getManagerOrdersBySession(
                currentSession.id,
                { status: 0, pageSize: 10 },
              );
              orders = sessionOrdersData?.items || [];
            }
          } catch {
            // Keep empty
          }
        }
        setLiveOrders(orders);
        setRobotArms(armsRes || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      const userId = (o.userId || "").toLowerCase();
      return id.includes(q) || userId.includes(q);
    });
  }, [liveOrders, globalQuery]);

  const filteredRobotArms = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return robotArms;
    return robotArms.filter((r) => {
      const code = (r.code || "").toLowerCase();
      const name = (r.name || "").toLowerCase();
      const status = (r.status || "").toLowerCase();
      return code.includes(q) || name.includes(q) || status.includes(q);
    });
  }, [robotArms, globalQuery]);

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
                        {order.userId?.slice(0, 10) || "Sinh viên"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {order.itemCount} món ·{" "}
                      {order.createdAtUtc
                        ? new Date(order.createdAtUtc).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-lg font-bold text-[#FF4C24] flex items-center gap-1">
                      <span>{(order.totalPrice || 0).toLocaleString()}</span>
                      <Image
                        src="/logo_point.png"
                        alt="coin"
                        width={14}
                        height={14}
                        className="object-contain inline-block"
                      />
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
              Cánh Tay Robot
            </h2>
            {filteredRobotArms.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 font-medium">
                {globalQuery.trim()
                  ? "Không tìm thấy robot nào khớp"
                  : "Không có cánh tay robot nào"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRobotArms.map((bot) => {
                  const isOk = bot.status === "Idle" || bot.status === "Busy";
                  return (
                    <div
                      key={bot.id}
                      className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-800">
                          {bot.name || bot.code}
                        </span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-semibold ${
                            isOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isOk ? "Sẵn sàng" : bot.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        Mã: <span className="font-bold text-gray-700">{bot.code}</span> · Trạm:{" "}
                        <span className="font-bold text-gray-700">#{bot.stationIndex}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
