"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  Package,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  RefreshCw,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { trayService } from "@/services/tray.service";
import type { TrayPoolSummary, TrayStatus } from "@/types/tray.types";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  TrayStatus,
  { label: string; dot: string; bg: string; text: string; border: string; icon: typeof Package }
> = {
  Available: {
    label: "Sẵn sàng",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    icon: PackageCheck,
  },
  Reserved: {
    label: "Đang giữ đơn",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
    icon: ShieldCheck,
  },
  InUse: {
    label: "Đang sử dụng",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/60",
    icon: PackageOpen,
  },
};

export default function ManagerTraysPage() {
  const [pool, setPool] = useState<TrayPoolSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "bulk">("single");
  const [singleCode, setSingleCode] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("TRAY");
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(10);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPool = async () => {
    try {
      setError(null);
      const data = await trayService.getPool();
      setPool(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(
          "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập bằng tài khoản Manager.",
        );
      } else if (status === 403) {
        setError("Tài khoản của bạn không có quyền truy cập chức năng này.");
      } else {
        setError("Không thể tải dữ liệu pool khay. Vui lòng thử lại.");
      }
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchPool();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const openCreateModal = () => {
    setCreateMode("single");
    setSingleCode("");
    setBulkPrefix("TRAY");
    setBulkFrom(1);
    setBulkTo(10);
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    setFormSubmitting(true);
    try {
      let result;
      if (createMode === "single") {
        if (!singleCode.trim()) {
          toast.error("Mã khay không được để trống.");
          setFormSubmitting(false);
          return;
        }
        if (trays.some((t) => t.code.toLowerCase() === singleCode.trim().toLowerCase())) {
          toast.error("Mã khay đã tồn tại. Vui lòng dùng mã khác.");
          setFormSubmitting(false);
          return;
        }
        result = await trayService.createSingle({ code: singleCode.trim() });
      } else {
        if (!bulkPrefix.trim()) {
          toast.error("Prefix không được để trống.");
          setFormSubmitting(false);
          return;
        }
        if (bulkTo < bulkFrom) {
          toast.error("Số kết thúc phải lớn hơn hoặc bằng số bắt đầu.");
          setFormSubmitting(false);
          return;
        }
        if (bulkTo - bulkFrom + 1 > 100) {
          toast.error("Tối đa 100 khay mỗi lần.");
          setFormSubmitting(false);
          return;
        }
        result = await trayService.createBulk({
          prefix: bulkPrefix.trim(),
          from: bulkFrom,
          to: bulkTo,
        });
      }

      setIsCreateOpen(false);
      const created = result.createdCodes.length;
      const skipped = result.skippedCodes.length;
      if (created > 0 && skipped > 0) {
        toast.success(`Tạo ${created} khay thành công, bỏ qua ${skipped} khay trùng.`);
      } else if (created > 0) {
        toast.success(`Tạo ${created} khay thành công!`);
      } else {
        toast.info(`Tất cả ${skipped} khay đã tồn tại, không có khay mới.`);
      }
      fetchPool();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo khay thất bại";
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const trays = pool?.trays ?? [];
  const filtered = trays.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.code.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) ||
      t.currentOrderId?.toLowerCase().includes(q)
    );
  });

  const available = pool?.available ?? 0;
  const lowStock = available < 5;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 animate-float">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Pool Khay</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Quản lý khay tài nguyên — mượn / trả tự động
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchPool().finally(() => setLoading(false));
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
              Đăng ký khay
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </button>
        </div>
      </div>

      {/* ── Pool Summary Cards ── */}
      {!loading && pool && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Available */}
          <div
            className={cn(
              "rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between",
              lowStock ? "bg-red-50/60 border-red-100" : "bg-emerald-50/60 border-emerald-100",
            )}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Khay sẵn sàng
                </p>
                {lowStock && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 border border-red-200/60 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="text-[10px] font-black text-red-700 uppercase">Sắp hết</span>
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-3xl font-extrabold",
                  lowStock ? "text-red-700" : "text-gray-900",
                )}
              >
                {available}
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                lowStock ? "bg-red-100 border-red-200" : "bg-emerald-100 border-emerald-200",
              )}
            >
              <PackageCheck
                className={cn("w-6 h-6", lowStock ? "text-red-600" : "text-emerald-600")}
              />
            </div>
          </div>

          {/* Reserved */}
          <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Đang giữ đơn
              </p>
              <p className="text-3xl font-extrabold text-gray-900">{pool.reserved}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 border border-amber-200">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          {/* In Use */}
          <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Đang sử dụng
              </p>
              <p className="text-3xl font-extrabold text-gray-900">{pool.inUse}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 border border-blue-200">
              <PackageOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          placeholder="Tìm theo mã khay, trạng thái, đơn hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <Package className="w-6 h-6 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải pool khay...</p>
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
              fetchPool().finally(() => setLoading(false));
            }}
            className="mt-4 px-5 py-2.5 bg-red-50 border border-red-200/60 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 p-20 text-center shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-lg">
            {search ? "Không tìm thấy khay phù hợp." : "Chưa có khay nào trong pool."}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {search ? "Thử từ khoá khác." : 'Nhấn "Đăng ký khay" để thêm khay mới.'}
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm animate-slide-up-3d"
          style={{ animationDelay: "300ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50/70">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    Mã khay
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    Đơn hiện tại
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    Cập nhật lúc
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tray, idx) => {
                  const s = STATUS_CONFIG[tray.status];
                  const Icon = s.icon;
                  return (
                    <tr
                      key={tray.id}
                      className="hover:bg-orange-50/30 transition-colors group animate-fade-in-scale"
                      style={{ animationDelay: `${350 + idx * 50}ms` }}
                    >
                      <td className="px-6 py-4">
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
                            {tray.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        {tray.currentOrderId ? (
                          <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                            {tray.currentOrderId.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tray.updatedAtUtc ? (
                          <span className="text-xs text-gray-400">
                            {new Date(tray.updatedAtUtc).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
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
          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-400">
              Hiển thị {filtered.length} / {trays.length} khay
            </p>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Đăng ký khay mới"
        size="lg"
      >
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex rounded-2xl border border-gray-200/60 bg-gray-50/50 p-1">
            <button
              onClick={() => setCreateMode("single")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                createMode === "single"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Đơn lẻ
              </span>
            </button>
            <button
              onClick={() => setCreateMode("bulk")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                createMode === "bulk"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <Layers className="w-4 h-4" />
                Hàng loạt
              </span>
            </button>
          </div>

          {/* Single mode */}
          {createMode === "single" && (
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Mã khay <span className="text-red-400">*</span>
              </label>
              <input
                value={singleCode}
                onChange={(e) => setSingleCode(e.target.value)}
                placeholder="VD: TRAY041"
                className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
              />
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                Nhập mã khay cần đăng ký. Khay trùng sẽ được bỏ qua.
              </p>
            </div>
          )}

          {/* Bulk mode */}
          {createMode === "bulk" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Prefix <span className="text-red-400">*</span>
                </label>
                <input
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  placeholder="VD: TRAY"
                  className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Từ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkFrom}
                    onChange={(e) => setBulkFrom(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Đến <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkTo}
                    onChange={(e) => setBulkTo(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all shadow-xs"
                  />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200/60 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-600">
                  Sẽ tạo:{" "}
                  <span className="font-mono font-bold text-gray-900">
                    {bulkPrefix}
                    {bulkFrom}
                  </span>{" "}
                  →{" "}
                  <span className="font-mono font-bold text-gray-900">
                    {bulkPrefix}
                    {bulkTo}
                  </span>{" "}
                  <span className="text-gray-400">({Math.max(0, bulkTo - bulkFrom + 1)} khay)</span>
                </p>
              </div>
            </div>
          )}

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
