"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X, Grid3X3, LayoutGrid, Lock, RefreshCw, AlertTriangle } from "lucide-react";
import { pickupSlotService } from "@/services/pickup-slot.service";
import type { PickupSlotSummary, PickupSlotStatus } from "@/types/pickup-slot.types";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  PickupSlotStatus,
  { label: string; dot: string; bg: string; text: string; border: string; icon: typeof Grid3X3 }
> = {
  Empty: {
    label: "Trống",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    icon: LayoutGrid,
  },
  Occupied: {
    label: "Đang giữ đơn",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
    icon: Lock,
  },
};

export default function ManagerPickupSlotsPage() {
  const [summary, setSummary] = useState<PickupSlotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [singleCode, setSingleCode] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await pickupSlotService.getList();
      setSummary(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(
          "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập bằng tài khoản Manager.",
        );
      } else if (status === 403) {
        setError("Tài khoản của bạn không có quyền truy cập chức năng này.");
      } else {
        setError("Không thể tải danh sách ô kệ. Vui lòng thử lại.");
      }
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const openCreateModal = () => {
    setSingleCode("");
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!singleCode.trim()) {
      toast.error("Mã ô kệ không được để trống.");
      return;
    }
    const currentSlots = summary?.slots || [];
    if (currentSlots.some((s) => s.code.toLowerCase() === singleCode.trim().toLowerCase())) {
      toast.error("Mã ô kệ đã tồn tại. Vui lòng dùng mã khác.");
      return;
    }
    setFormSubmitting(true);
    try {
      const result = await pickupSlotService.createSingle({ code: singleCode.trim() });
      setIsCreateOpen(false);
      const created = result.createdCodes.length;
      if (created > 0) {
        toast.success(`Tạo ô kệ ${singleCode.trim()} thành công!`);
      } else {
        toast.info("Mã ô kệ đã tồn tại.");
      }
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo ô kệ thất bại";
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const slots = summary?.slots ?? [];
  const filtered = slots.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      s.orderId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
            <Grid3X3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Ô Kệ Pickup</h1>
            <p className="text-base text-gray-500 mt-0.5">Quản lý ô kệ nơi khách đến lấy món</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
            className="p-3 border border-gray-200/60 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-xs active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button
            onClick={openCreateModal}
            className="relative overflow-hidden group px-6 py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2.5 justify-center">
              <Plus className="w-4 h-4" />
              Đăng ký ô kệ
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
          {/* Empty */}
          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ô trống</p>
              <p className="text-3xl font-extrabold text-gray-900">{summary.empty}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 border border-emerald-200">
              <LayoutGrid className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          {/* Occupied */}
          <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Đang giữ đơn
              </p>
              <p className="text-3xl font-extrabold text-gray-900">{summary.occupied}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 border border-amber-200">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm theo mã ô, trạng thái, đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => {}}
          className="px-6 py-3.5 bg-gray-900 text-white rounded-3xl text-base font-bold hover:bg-gray-800 transition-all shadow-xs active:scale-98 shrink-0"
        >
          Tìm kiếm
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <Grid3X3 className="w-6 h-6 text-violet-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải ô kệ...</p>
        </div>
      ) : error ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-red-100 p-16 text-center shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.04)_0%,transparent_70%)]" />
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200/60 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-600 font-bold text-lg">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
            className="mt-4 px-5 py-2.5 bg-red-50 border border-red-200/60 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 p-20 text-center shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)]" />
          <Grid3X3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-lg">
            {search ? "Không tìm thấy ô kệ phù hợp." : "Chưa có ô kệ nào."}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {search ? "Thử từ khoá khác." : 'Nhấn "Đăng ký ô kệ" để thêm ô mới.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mã ô
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Đơn hàng
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Khay
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Bind lúc
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((slot) => {
                  const s = STATUS_CONFIG[slot.status];
                  const Icon = s.icon;
                  return (
                    <tr key={slot.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
                              s.bg,
                              s.border,
                            )}
                          >
                            <Icon className={cn("w-4 h-4", s.text)} />
                          </div>
                          <code className="text-sm font-mono font-bold text-gray-800">
                            {slot.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                            s.bg,
                            s.text,
                            s.border,
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {slot.orderId ? (
                          <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                            {slot.orderId.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {slot.trayId ? (
                          <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                            {slot.trayId.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {slot.updatedAtUtc ? (
                          <span className="text-sm font-bold text-gray-600">
                            {new Date(slot.updatedAtUtc).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-8 py-5 bg-gray-50/50">
            <p className="text-base font-semibold text-gray-500">
              Hiển thị <span className="font-black text-gray-800">{filtered.length}</span> /{" "}
              <span className="font-black text-gray-800">{slots.length}</span> ô kệ
            </p>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Đăng ký ô kệ mới"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Mã ô kệ <span className="text-red-400">*</span>
            </label>
            <input
              value={singleCode}
              onChange={(e) => setSingleCode(e.target.value)}
              placeholder="VD: SLOT01"
              className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
            />
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Nhập mã ô kệ mới cần đăng ký (Ví dụ: SLOT01).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-6 py-3 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs"
            >
              Huỷ
            </button>
            <button
              onClick={handleCreateSubmit}
              disabled={formSubmitting}
              className="relative overflow-hidden group px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2.5 justify-center">
                {formSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Đăng ký
                  </>
                )}
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
