"use client";

import Image from "next/image";
import { Package, Clock, CheckCircle, Coins } from "lucide-react";

interface OrdersStatsProps {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  totalSpentPoints: number;
}

export function OrdersStats({
  totalCount,
  pendingCount,
  completedCount,
  totalSpentPoints,
}: OrdersStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Orders */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
          <Package className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Tổng đơn hàng</p>
          <p className="text-lg font-bold text-slate-900">{totalCount}</p>
        </div>
      </div>

      {/* Pending / Processing */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Đang xử lý</p>
          <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Hoàn thành</p>
          <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
        </div>
      </div>

      {/* Total Spent Points */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3.5 shadow-2xs hover:border-slate-300 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#D35400] shrink-0">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">Tổng xu đã tiêu</p>
          <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
            {new Intl.NumberFormat("vi-VN").format(totalSpentPoints)}
            <Image
              src="/logo_point.png"
              alt="coin"
              width={15}
              height={15}
              className="object-contain shrink-0"
            />
          </p>
        </div>
      </div>
    </div>
  );
}
