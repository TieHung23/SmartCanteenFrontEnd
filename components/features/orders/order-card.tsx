"use client";

import Image from "next/image";
import { Utensils, Calendar, ChevronRight, Clock } from "lucide-react";
import { type OrderStatus, type OrderListItem } from "@/types/order.types";
import { REFUND_STATUS_META } from "@/types/refund.types";

interface OrderCardProps {
  order: OrderListItem;
  refundStatus?: number;
  onClick: () => void;
  onRefundClick?: (e: React.MouseEvent) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dotColor: string; textColor: string; bgColor: string }
> = {
  0: {
    label: "Chờ xử lý",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  4: {
    label: "Đang chuẩn bị",
    dotColor: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  1: {
    label: "Sẵn sàng",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  2: {
    label: "Hoàn thành",
    dotColor: "bg-emerald-600",
    textColor: "text-emerald-800",
    bgColor: "bg-emerald-50",
  },
  3: {
    label: "Đã hủy",
    dotColor: "bg-rose-500",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
  },
  7: {
    label: "Quá hạn",
    dotColor: "bg-slate-400",
    textColor: "text-slate-600",
    bgColor: "bg-slate-100",
  },
};

export function OrderCard({ order, refundStatus, onClick, onRefundClick }: OrderCardProps) {
  const statusInfo = STATUS_CONFIG[order.status as OrderStatus] || {
    label: "Chờ xử lý",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
  };

  const isEligibleForRefund = refundStatus === undefined && order.status === 2;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-orange-300 p-4 sm:p-4.5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md"
    >
      {/* 12-Column Grid for perfect vertical column alignment across rows */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
        {/* Col 1 (5 cols): Order Info & Metadata */}
        <div className="md:col-span-5 flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5 text-[#D35400]" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#D35400] transition-colors truncate">
                Đơn hàng #{order.id.slice(0, 8)}
              </h3>
              {order.sessionName && (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 truncate max-w-[140px]">
                  {order.sessionName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
              <span className="font-medium">{order.itemCount} món ăn</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(order.createdAtUtc)}
              </span>
            </div>
          </div>
        </div>

        {/* Col 2 (2 cols): Status & Refund Status */}
        <div className="md:col-span-2 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 min-h-[44px]">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
            <span>{statusInfo.label}</span>
          </div>

          {refundStatus !== undefined && (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
              <Clock className="w-3 h-3" />
              <span>{REFUND_STATUS_META[refundStatus as 0 | 1 | 2]?.label || "Hoàn tiền"}</span>
            </div>
          )}
        </div>

        {/* Col 3 (2 cols): Total Price */}
        <div className="md:col-span-2 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            TỔNG TIỀN
          </p>
          <p className="text-base font-extrabold text-slate-900 flex items-center gap-1">
            {new Intl.NumberFormat("vi-VN").format(order.totalPrice)}
            <Image
              src="/logo_point.png"
              alt="coin"
              width={16}
              height={16}
              className="object-contain shrink-0"
            />
          </p>
        </div>

        {/* Col 4 (3 cols): Action Buttons */}
        <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {isEligibleForRefund && onRefundClick && (
            <button
              onClick={onRefundClick}
              className="text-xs font-semibold px-3 py-2 rounded-full text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shrink-0"
            >
              Hoàn tiền
            </button>
          )}

          <button
            onClick={onClick}
            className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1 shadow-2xs shrink-0"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
