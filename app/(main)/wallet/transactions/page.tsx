"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Loader2, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { orderService } from "@/services/order.service";
import type { OrderListItem } from "@/types/order.types";
import { getAccessToken } from "@/lib/auth-token-storage";
import { ROUTES } from "@/config/routes";

interface CombinedTx {
  id: string;
  type: "payment" | "topup";
  label: string;
  amount: number;
  date: string;
  orderStatus?: number;
}

const ORDER_LABEL: Record<number, string> = {
  0: "Đơn hàng - Chờ xử lý",
  1: "Đơn hàng - Chờ lấy",
  2: "Đơn hàng - Hoàn thành",
  3: "Đơn hàng - Đã hủy",
  4: "Đơn hàng - Đang chuẩn bị",
  7: "Đơn hàng - Quá hạn",
};

const ORDER_STATUS_COLOR: Record<number, string> = {
  0: "text-amber-600",
  1: "text-emerald-600",
  2: "text-indigo-600",
  3: "text-red-500",
  4: "text-blue-600",
  7: "text-gray-500",
};

const TX_KEY = "sc_topup_records";

function getLocalTopups(): CombinedTx[] {
  try {
    const raw = sessionStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTopup(tx: CombinedTx) {
  const list = getLocalTopups();
  list.unshift(tx);
  sessionStorage.setItem(TX_KEY, JSON.stringify(list.slice(0, 200)));
}

export { saveLocalTopup };

export default function TransactionsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }

    startTransition(() => {
      setLoading(true);
    });

    orderService
      .getMyOrders({ pageSize: 100 })
      .then((res) => {
        setOrders(res.items || []);
      })
      .catch(() => {
        console.error("Failed to fetch orders");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const transactions = useMemo<CombinedTx[]>(() => {
    const orderTxs: CombinedTx[] = orders.map((o) => ({
      id: `order_${o.id}`,
      type: "payment" as const,
      label: ORDER_LABEL[o.status] ?? `Đơn hàng #${o.id.slice(0, 8)}`,
      amount: o.totalPrice,
      date: o.createdAtUtc,
      orderStatus: o.status,
    }));

    const topupTxs = getLocalTopups();
    return [...topupTxs, ...orderTxs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orders]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  const formatDate = (utc: string) => {
    const d = new Date(utc);
    return d.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lịch sử giao dịch</h1>
              <p className="text-sm text-gray-500">{transactions.length} giao dịch</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#E86A33]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <p className="text-sm">Chưa có giao dịch nào</p>
              <p className="text-xs mt-2">Đơn hàng và nạp tiền sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            <div>
              {transactions.map((tx) => {
                const isInflow = tx.type === "topup";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 border-b border-gray-100 last:border-b-0 px-6 py-4 hover:bg-gray-50 transition-all"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isInflow ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {isInflow ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800">
                        {tx.type === "topup" ? "Nạp tiền" : tx.label}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isInflow ? "text-green-600" : "text-red-500"}`}>
                        {isInflow ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.orderStatus !== undefined && (
                        <p
                          className={`text-xs font-medium ${
                            ORDER_STATUS_COLOR[tx.orderStatus] || "text-gray-400"
                          }`}
                        >
                          {ORDER_LABEL[tx.orderStatus]?.split(" - ")[1] || ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href={ROUTES.ORDERS}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#D35400] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem chi tiết đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
