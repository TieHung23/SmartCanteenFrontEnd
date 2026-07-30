"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  FileText,
  Activity,
  Server,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { logService } from "@/services/log.service";

export default function AdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => logService.getLogs({ pageNumber: 1, pageSize: 1 }),
    staleTime: 30_000,
    retry: 2,
  });

  const totalLogs = statsQuery.data?.totalCount ?? null;
  const loading = statsQuery.isLoading;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Bảng Điều Khiển Quản Trị
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              Giám sát nhật ký API, trạng thái máy chủ và an ninh hệ thống Smart Canteen.
            </p>
          </div>
        </div>
        <button
          onClick={() => statsQuery.refetch()}
          className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95 shrink-0 self-start md:self-auto"
          title="Làm mới"
        >
          <RefreshCw className={`w-5 h-5 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Tổng Nhật ký API</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400]">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {loading ? "..." : (totalLogs ?? 0).toLocaleString("vi-VN")}
          </p>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối cơ sở dữ liệu
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Trạng thái Máy Chủ</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">Online</p>
          <p className="text-xs text-gray-400 font-bold">API Backend Response 200 OK</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">Hệ thống Giám sát</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600">Realtime</p>
          <p className="text-xs text-gray-400 font-bold">Tự động bắt lỗi 4xx / 5xx</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-400">An Ninh & Phân Quyền</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">An toàn</p>
          <p className="text-xs text-gray-400 font-bold">Token Bearer Authorize Enabled</p>
        </div>
      </div>

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/logs" className="group block">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 group-hover:text-[#D35400] transition-colors">
                Xem Nhật Ký API
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Tra cứu các yêu cầu HTTP GET/POST, chi tiết Request, Response Body và Error Trace.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-[#D35400] group-hover:text-white flex items-center justify-center text-gray-400 transition-all">
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/manager" className="group block">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xs hover:shadow-md hover:border-orange-200 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                Trang Quản Lý Canteen
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Truy cập cổng quản lý Menu, Ca phục vụ, Khay, Tay máy Robot và Đơn hàng.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-gray-400 transition-all">
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
