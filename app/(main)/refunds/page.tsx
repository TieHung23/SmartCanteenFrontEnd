"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RotateCcw,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Calendar,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { refundService } from "@/services/refund.service";
import {
  normalizeRefundStatus,
  REFUND_STATUS_META,
  type CustomerRefundListItem,
} from "@/types/refund.types";
import { formatCurrency } from "@/lib/utils";
import { CustomerRefundDetailModal } from "@/components/features/refund/customer-refund-detail-modal";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RefundListPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatusFilter = searchParams.get("status") ?? "all";

  const [items, setItems] = useState<CustomerRefundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>(initialStatusFilter);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam: number | undefined = undefined;
      if (activeFilter === "pending") statusParam = 1;
      if (activeFilter === "approved") statusParam = 2;
      if (activeFilter === "rejected") statusParam = 3;

      const res = await refundService.getMyRefunds({
        status: statusParam,
        pageNumber,
        pageSize: 10,
      });

      setItems((res.items || []) as unknown as CustomerRefundListItem[]);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch {
      setItems([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, pageNumber]);

  useEffect(() => {
    let isMounted = true;

    let statusParam: number | undefined = undefined;
    if (activeFilter === "pending") statusParam = 1;
    if (activeFilter === "approved") statusParam = 2;
    if (activeFilter === "rejected") statusParam = 3;

    refundService
      .getMyRefunds({
        status: statusParam,
        pageNumber,
        pageSize: 10,
      })
      .then((res) => {
        if (isMounted) {
          setItems((res.items || []) as unknown as CustomerRefundListItem[]);
          setTotalPages(res.totalPages || 1);
          setTotalCount(res.totalCount || 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter, pageNumber]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPageNumber(1);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#D35400] transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Yêu cầu hoàn tiền
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 pl-0.5">
                  {loading ? "Đang tải danh sách..." : `Tổng cộng ${totalCount} yêu cầu hoàn tiền`}
                </p>
              </div>

              <button
                onClick={fetchRefunds}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-500" : ""}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "pending", label: "Đang xử lý" },
                { id: "approved", label: "Đã duyệt" },
                { id: "rejected", label: "Từ chối" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === tab.id
                      ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "bg-slate-100/90 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
                <p className="text-xs font-semibold">Đang tải danh sách hoàn tiền...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-800">Không có yêu cầu hoàn tiền nào</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Bạn chưa gửi yêu cầu hoàn tiền nào thuộc mục này.
                  </p>
                </div>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-[1.02] transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Xem lịch sử đơn hàng</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const statusNum = normalizeRefundStatus(item.status);
                  const statusMeta = REFUND_STATUS_META[statusNum] || REFUND_STATUS_META[1];

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-orange-200 p-5 shadow-2xs transition-all duration-200 space-y-4"
                    >
                      {/* Item Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5"
                            style={{
                              color: statusMeta.color,
                              backgroundColor: statusMeta.bg,
                            }}
                          >
                            {statusNum === 2 ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : statusNum === 3 ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {statusMeta.label}
                          </span>

                          <div className="bg-orange-50 border border-orange-200/60 text-orange-900 px-3 py-1 rounded-xl text-xs font-bold">
                            {item.policyName || "Hoàn tiền"}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(item.createdAtUtc)}</span>
                        </div>
                      </div>

                      {/* Item Content */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Đơn hàng:</span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              #{item.orderId.slice(0, 12)}
                            </span>
                            <Link
                              href={`/orders/${item.orderId}`}
                              className="text-xs font-bold text-orange-600 hover:underline"
                            >
                              (Chi tiết đơn)
                            </Link>
                          </div>

                          {(item.currentDishName || item.dishName) && (
                            <p className="text-xs font-bold text-slate-700">
                              Món: {item.currentDishName || item.dishName}
                            </p>
                          )}
                        </div>

                        {/* Amount & Detail Trigger */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Số điểm hoàn
                            </p>
                            <p className="text-base font-black text-emerald-600 flex items-center justify-end gap-1">
                              <span>+{formatCurrency(item.refundAmount || 0)}</span>
                              <Image
                                src="/logo_point.png"
                                alt="point"
                                width={16}
                                height={16}
                                className="object-contain"
                              />
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedRefundId(item.id)}
                            className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-xs">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Trang trước
                </button>

                <span className="font-bold text-slate-500">
                  Trang {pageNumber} / {totalPages}
                </span>

                <button
                  onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                  disabled={pageNumber >= totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Customer Refund Detail Modal */}
      <CustomerRefundDetailModal
        refundId={selectedRefundId}
        onClose={() => setSelectedRefundId(null)}
      />
    </>
  );
}

export default function CustomerRefundsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
        </div>
      }
    >
      <RefundListPageInner />
    </Suspense>
  );
}
