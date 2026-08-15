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
  AlertTriangle,
  Eye,
  Layers,
} from "lucide-react";
import { trayService } from "@/services/tray.service";
import type { TrayPoolSummary, TrayStatus } from "@/types/tray.types";
import Modal from "../_components/modal";
import TrayDetailModal from "@/components/features/trays/tray-detail-modal";
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
  const [selectedTrayId, setSelectedTrayId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [singleCode, setSingleCode] = useState("");

  const [bulkPrefix, setBulkPrefix] = useState("TRAY");
  const [bulkFrom, setBulkFrom] = useState(31);
  const [bulkTo, setBulkTo] = useState(40);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenDetail = (id: string) => {
    setSelectedTrayId(id);
    setIsDetailOpen(true);
  };

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
    setSingleCode("");
    setBulkPrefix("TRAY");
    setBulkFrom(31);
    setBulkTo(40);
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    setFormSubmitting(true);
    try {
      if (createMode === "single") {
        if (!singleCode.trim()) {
          toast.error("Mã khay không được để trống.");
          setFormSubmitting(false);
          return;
        }
        const result = await trayService.createSingle({ code: singleCode.trim() });
        setIsCreateOpen(false);
        const created = result.createdCodes.length;
        if (created > 0) {
          toast.success(`Tạo khay "${result.createdCodes[0] || singleCode.trim()}" thành công!`);
        } else {
          toast.error("Khay đã tồn tại trong hệ thống.");
        }
      } else {
        if (!bulkPrefix.trim()) {
          toast.error("Prefix không được để trống.");
          setFormSubmitting(false);
          return;
        }
        if (bulkFrom <= 0 || bulkTo < bulkFrom) {
          toast.error("Khoảng chỉ số (từ - đến) không hợp lệ.");
          setFormSubmitting(false);
          return;
        }
        const result = await trayService.createBulk({
          prefix: bulkPrefix.trim().toUpperCase(),
          from: bulkFrom,
          to: bulkTo,
        });
        setIsCreateOpen(false);
        const created = result.createdCodes.length;
        const skipped = result.skippedCodes.length;
        if (created > 0 && skipped > 0) {
          toast.success(`Đã tạo ${created} khay mới, bỏ qua ${skipped} khay trùng.`);
        } else if (created > 0) {
          toast.success(`Đã tạo thành công ${created} khay hàng loạt!`);
        } else {
          toast.info("Tất cả các khay trong dải này đều đã tồn tại.");
        }
      }
      fetchPool();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể tạo khay.";
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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Package className="w-7 h-7 text-white" />
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
      {/* ── Search Bar ── */}
      <div className="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm theo mã khay, trạng thái, đơn hàng..."
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
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mã khay
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Đơn hiện tại
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Cập nhật lúc
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tray) => {
                  const s = STATUS_CONFIG[tray.status];
                  const Icon = s.icon;
                  return (
                    <tr
                      key={tray.id}
                      className="hover:bg-orange-50/20 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(tray.id)}
                    >
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
                          <code className="text-sm font-mono font-bold text-gray-800 group-hover:text-[#D35400] transition-colors">
                            {tray.code}
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
                        {tray.currentOrderId &&
                        tray.currentOrderId !== "00000000-0000-0000-0000-000000000000" ? (
                          <code className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                            {tray.currentOrderId.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {tray.updatedAtUtc ? (
                          <span className="text-sm font-bold text-gray-600">
                            {new Date(tray.updatedAtUtc).toLocaleString("vi-VN", {
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
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(tray.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#D35400] hover:text-white"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
              <span className="font-black text-gray-800">{trays.length}</span> khay
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
          {/* Mode Switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setCreateMode("single")}
              className={cn(
                "px-5 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
                createMode === "single"
                  ? "border-[#D35400] text-[#D35400]"
                  : "border-transparent text-gray-400 hover:text-gray-600",
              )}
            >
              <Plus className="w-4 h-4" />
              Đơn lẻ (Single)
            </button>
            <button
              onClick={() => setCreateMode("bulk")}
              className={cn(
                "px-5 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
                createMode === "bulk"
                  ? "border-[#D35400] text-[#D35400]"
                  : "border-transparent text-gray-400 hover:text-gray-600",
              )}
            >
              <Layers className="w-4 h-4" />
              Hàng loạt (Bulk)
            </button>
          </div>

          {createMode === "single" ? (
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
                Nhập mã khay cần đăng ký. Khay trùng sẽ tự động được bỏ qua.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Tiền tố (Prefix) <span className="text-red-400">*</span>
                </label>
                <input
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  placeholder="VD: TRAY"
                  className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 font-mono font-bold uppercase transition-all shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Từ số (From) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkFrom}
                    onChange={(e) => setBulkFrom(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all shadow-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Đến số (To) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkTo}
                    onChange={(e) => setBulkTo(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all shadow-xs font-bold"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Hệ thống sẽ tạo tự động các khay từ{" "}
                <span className="font-mono font-bold text-gray-700">
                  {bulkPrefix}
                  {bulkFrom}
                </span>{" "}
                đến{" "}
                <span className="font-mono font-bold text-gray-700">
                  {bulkPrefix}
                  {bulkTo}
                </span>{" "}
                (tối đa 100 khay/lần). Mã trùng sẽ tự động bỏ qua.
              </p>
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
                    Đăng ký {createMode === "bulk" ? "hàng loạt" : ""}
                  </>
                )}
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
            </button>
          </div>
        </div>
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <TrayDetailModal
        trayId={selectedTrayId}
        initialCurrentOrderId={trays.find((t) => t.id === selectedTrayId)?.currentOrderId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefreshPool={fetchPool}
      />
    </div>
  );
}
