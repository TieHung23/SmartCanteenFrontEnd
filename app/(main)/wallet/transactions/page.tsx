"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ShoppingBag,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { paymentService, type WalletTransaction } from "@/services/payment.service";
import { getAccessToken } from "@/lib/auth-token-storage";
import { ROUTES } from "@/config/routes";
import { useSignalr } from "@/lib/hooks/use-signalr";

const TX_KEY = "sc_topup_records";

interface LocalTx {
  id: string;
  type: "payment" | "topup";
  label: string;
  amount: number;
  date: string;
  orderStatus?: number;
}

function getLocalTopups(): LocalTx[] {
  try {
    const raw = sessionStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTopup(tx: LocalTx) {
  const list = getLocalTopups();
  list.unshift(tx);
  sessionStorage.setItem(TX_KEY, JSON.stringify(list.slice(0, 200)));
}

export { saveLocalTopup };

type FilterType = 0 | 1 | 2 | 3; // 0: All, 1: TopUp, 2: OrderPayment, 3: Refund

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 0, label: "Tất cả" },
  { id: 1, label: "Nạp tiền" },
  { id: 2, label: "Thanh toán" },
  { id: 3, label: "Hoàn tiền" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const loadTransactions = useCallback(
    async (type: FilterType = activeFilter, page: number = pageNumber) => {
      setLoading(true);
      try {
        const res = await paymentService.getWalletTransactions({
          transactionType: type === 0 ? undefined : type,
          pageNumber: page,
          pageSize: 15,
        });
        setTransactions(res.items || []);
        setPageNumber(res.pageNumber || 1);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
        setHasNextPage(res.hasNextPage);
        setHasPreviousPage(res.hasPreviousPage);
      } catch (error) {
        console.error("Failed to load wallet transactions:", error);
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, pageNumber],
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(ROUTES.LOGIN);
      return;
    }
    startTransition(() => {
      loadTransactions(activeFilter, pageNumber);
    });
  }, [router, activeFilter, pageNumber, loadTransactions]);

  // Real-time updates via SignalR
  useSignalr(
    useCallback(() => {
      loadTransactions(activeFilter, pageNumber);
    }, [loadTransactions, activeFilter, pageNumber]),
  );

  const handleFilterChange = (filterId: FilterType) => {
    setActiveFilter(filterId);
    setPageNumber(1);
  };

  const formatDate = (utc: string) => {
    if (!utc) return "";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-zinc-100 font-sans pb-16 py-6 sm:py-8">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm hover:bg-gray-50 transition-all border border-gray-200/80 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Lịch sử giao dịch ví
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount > 0
                  ? `Hiển thị ${transactions.length} trên tổng số ${totalCount} giao dịch`
                  : "Theo dõi biến động số dư và giao dịch thực hiện"}
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-gray-200/80 p-1.5 rounded-2xl self-start md:self-auto shadow-inner border border-gray-300/40">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleFilterChange(opt.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeFilter === opt.id
                    ? "bg-white text-[#D35400] shadow-md scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Card */}
        <div className="rounded-3xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-[#D35400]" />
              <p className="text-sm font-medium text-gray-500">Đang tải lịch sử giao dịch...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                <Receipt className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-700">Chưa có giao dịch nào</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm text-center">
                Các giao dịch nạp tiền, thanh toán đơn hàng và hoàn tiền sẽ xuất hiện chi tiết tại
                đây
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const isTopUp = tx.transactionType === 1 || tx.transactionTypeName === "TopUp";
                const isRefund = tx.transactionType === 3 || tx.transactionTypeName === "Refund";
                const isOrder =
                  tx.transactionType === 2 || tx.transactionTypeName === "OrderPayment";
                const isInflow = isTopUp || isRefund || tx.amount > 0;

                let title = tx.transactionTypeName || "Giao dịch ví";
                if (isTopUp) title = "Nạp tiền vào ví";
                else if (isRefund) title = "Hoàn tiền đơn hàng";
                else if (isOrder) title = "Thanh toán đơn hàng";

                return (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6 hover:bg-gray-50/80 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                          isTopUp
                            ? "bg-green-100 text-green-600 border border-green-200/60"
                            : isRefund
                              ? "bg-emerald-100 text-emerald-600 border border-emerald-200/60"
                              : "bg-red-100 text-red-500 border border-red-200/60"
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6 sm:h-7 sm:w-7" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            {title}
                          </p>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                              isTopUp
                                ? "bg-green-50 text-green-700 border-green-200"
                                : isRefund
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {isTopUp ? "Nạp tiền" : isRefund ? "Hoàn tiền" : "Thanh toán"}
                          </span>

                          {tx.orderId && (
                            <Link
                              href={`/orders/${tx.orderId}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200/80 transition-colors"
                            >
                              <ShoppingBag className="w-3 h-3 text-[#D35400]" />
                              <span>Đơn: #{tx.orderId.slice(0, 8)}</span>
                              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 font-medium mt-1.5">
                          <span>{formatDate(tx.createdAtUtc)}</span>
                          {tx.balanceBefore !== undefined && tx.balanceAfter !== undefined && (
                            <span className="hidden md:inline-block bg-gray-100 px-2.5 py-0.5 rounded-md text-gray-600">
                              Số dư: {new Intl.NumberFormat("vi-VN").format(tx.balanceBefore)}{" "}
                              &rarr;{" "}
                              <strong className="text-gray-900">
                                {new Intl.NumberFormat("vi-VN").format(tx.balanceAfter)}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 shrink-0">
                      <p
                        className={`font-black text-lg sm:text-xl flex items-center gap-1.5 ${
                          isInflow ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        <span>
                          {isInflow ? "+" : "-"}
                          {new Intl.NumberFormat("vi-VN").format(Math.abs(tx.amount))}
                        </span>
                        <Image
                          src="/logo_point.png"
                          alt="pts"
                          width={20}
                          height={20}
                          className="object-contain inline-block drop-shadow-sm"
                        />
                      </p>
                      {tx.balanceAfter !== undefined && (
                        <p className="text-xs text-gray-500 mt-1 font-medium md:hidden">
                          Sau GD:{" "}
                          <strong className="text-gray-800">
                            {new Intl.NumberFormat("vi-VN").format(tx.balanceAfter)}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-5 bg-gray-50/70">
              <button
                disabled={!hasPreviousPage || loading}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-xs transition-all hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" /> Trang trước
              </button>
              <span className="text-xs sm:text-sm font-semibold text-gray-600">
                Trang{" "}
                <strong className="text-gray-900 text-base font-extrabold">{pageNumber}</strong> /{" "}
                {totalPages}
              </span>
              <button
                disabled={!hasNextPage || loading}
                onClick={() => setPageNumber((p) => p + 1)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-xs transition-all hover:bg-gray-50"
              >
                Trang sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={ROUTES.ORDERS}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D35400] hover:text-[#B34700] hover:underline transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Xem lịch sử đơn hàng đã đặt
          </Link>
        </div>
      </div>
    </div>
  );
}
