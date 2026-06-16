"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useMyOrders } from "@/lib/hooks/useCanteen";
import { ORDER_STATUS_META, type OrderStatus } from "@/types/order.types";
import { ROUTES } from "@/config/routes";
import { ClipboardList, ChevronRight, ShoppingBag } from "lucide-react";

const TABS: { label: string; status: OrderStatus | null }[] = [
  { label: "All", status: null },
  { label: "Pending", status: 0 },
  { label: "Ready for Pickup", status: 1 },
  { label: "Completed", status: 2 },
  { label: "Cancelled", status: 3 },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);

  const { data: ordersData, isLoading } = useMyOrders(
    activeTab !== null ? { status: activeTab, pageSize: 50 } : { pageSize: 50 },
  );

  const responseData = ordersData as unknown as {
    items?: Array<{
      id: string;
      mealId: string;
      transactionId: string | null;
      userId: string;
      status: number;
      totalPrice: number;
      itemCount: number;
      createdAtUtc: string;
    }>;
  };

  const orders = responseData?.items || [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <ClipboardList className="w-7 h-7 text-[#D35400]" />
            <h1 className="text-3xl font-extrabold text-gray-800">My Orders</h1>
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
              <h3 className="text-lg font-bold text-gray-500 mb-2">No orders found</h3>
              <p className="text-sm text-gray-400 mb-6">
                {activeTab !== null
                  ? `No orders with status "${ORDER_STATUS_META[activeTab]?.label}".`
                  : "You haven't placed any orders yet."}
              </p>
              <Link
                href={ROUTES.SESSION}
                className="inline-flex items-center px-6 py-3 bg-[#D35400] text-white font-bold text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)]"
              >
                Browse Sessions
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const meta = ORDER_STATUS_META[order.status as OrderStatus] || ORDER_STATUS_META[0];
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-2xl border border-gray-50 p-5 hover:shadow-md hover:border-orange-100 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: meta.bg }}
                        >
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded-md"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {formatDate(order.createdAtUtc)}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 mt-1.5">
                            {order.itemCount} item{order.itemCount > 1 ? "s" : ""} •{" "}
                            <span className="text-[#D35400]">
                              {new Intl.NumberFormat("vi-VN").format(order.totalPrice)} pts
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                            ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D35400] transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
