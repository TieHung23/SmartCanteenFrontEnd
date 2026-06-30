"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useMyOrders } from "@/lib/hooks/useCanteen";
import { ORDER_STATUS_META, type OrderStatus } from "@/types/order.types";
import { refundService } from "@/services/refund.service";
import { REFUND_STATUS_META, normalizeRefundStatus } from "@/types/refund.types";
import { ROUTES } from "@/config/routes";
import { ClipboardList, ChevronRight, ShoppingBag, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";

const TABS: { label: string; status: OrderStatus | null }[] = [
  { label: "Tất cả", status: null },
  { label: "Chờ xử lý", status: 0 },
  { label: "Sẵn sàng", status: 1 },
  { label: "Hoàn thành", status: 2 },
  { label: "Đã hủy", status: 3 },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [refundMap, setRefundMap] = useState<Record<string, number>>({});

  const { data: ordersData, isLoading } = useMyOrders({ pageSize: 100 });

  useSignalr(
    useCallback(
      (notification: NotificationItem) => {
        if (notification.type === "Order.StatusChanged" || notification.type === "Order.Created") {
          queryClient.invalidateQueries({ queryKey: ["my-orders"] });
          refundService
            .getMyRefunds()
            .then((res) => {
              const map: Record<string, number> = {};
              (res?.items || []).forEach((r: { orderId: string; status: unknown }) => {
                map[r.orderId] = normalizeRefundStatus(r.status);
              });
              setRefundMap(map);
            })
            .catch(() => {});
        }
      },
      [queryClient],
    ),
  );

  const responseData = ordersData as unknown as {
    items?: Array<{
      id: string;
      sessionId: string;
      transactionId: string | null;
      userId: string;
      status: number;
      totalPrice: number;
      itemCount: number;
      createdAtUtc: string;
    }>;
  };

  const allOrders = responseData?.items || [];
  const orders = activeTab !== null ? allOrders.filter((o) => o.status === activeTab) : allOrders;

  useEffect(() => {
    refundService
      .getMyRefunds()
      .then((res) => {
        const map: Record<string, number> = {};
        (res?.items || []).forEach((r: { orderId: string; status: number }) => {
          map[r.orderId] = r.status;
        });
        setRefundMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <ClipboardList className="w-7 h-7 text-[#D35400]" />
            <h1 className="text-3xl font-extrabold text-gray-800">Đơn hàng của tôi</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.status)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.status
                    ? "bg-[#D35400] text-white shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-orange-200 hover:text-[#D35400]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl border border-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-500 mb-2">Không có đơn hàng</h3>
              <p className="text-sm text-gray-400 mb-6">
                {activeTab !== null
                  ? `Không có đơn hàng với trạng thái "${ORDER_STATUS_META[activeTab]?.label}".`
                  : "Bạn chưa đặt đơn hàng nào."}
              </p>
              <Link
                href={ROUTES.SESSION}
                className="inline-flex items-center px-6 py-3 bg-[#D35400] text-white font-bold text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)]"
              >
                Chọn phiên ăn
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 hover:shadow-lg hover:border-orange-100/70 transition-all group cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className="text-xs font-black px-3.5 py-1.5 rounded-lg"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            {refundMap[order.id] !== undefined && (
                              <span
                                className="text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1.5"
                                style={{
                                  background:
                                    REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.bg ||
                                    "#fef2f2",
                                  color:
                                    REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.color ||
                                    "#ef4444",
                                }}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {REFUND_STATUS_META[refundMap[order.id] as 0 | 1 | 2]?.label}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 font-semibold">
                              {formatDate(order.createdAtUtc)}
                            </span>
                          </div>
                          <p className="text-base font-extrabold text-gray-800 mt-2.5">
                            {order.itemCount} món •{" "}
                            <span className="inline-flex items-center gap-1 text-[#D35400] font-black text-lg">
                              <span>{new Intl.NumberFormat("vi-VN").format(order.totalPrice)}</span>
                              <Image
                                src="/logo_point.png"
                                alt="coin"
                                width={18}
                                height={18}
                                className="object-contain"
                              />
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {refundMap[order.id] === undefined && order.status === 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${ROUTES.REFUND}?orderId=${order.id}`);
                            }}
                            className="text-xs font-black px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                          >
                            Yêu cầu hoàn tiền
                          </button>
                        )}
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-[#D35400] transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
