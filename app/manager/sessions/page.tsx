"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  Trash2,
  Copy,
  Coffee,
  Pencil,
  Power,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import dayjs from "dayjs";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";
import { NewSessionForm } from "./_components/new-session-form";
import { SessionCalendarHeatmap } from "@/components/features/sessions/session-calendar-heatmap";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManagerSessionsPage() {
  const router = useRouter();
  const isSessionLive = (s: SessionListItem) => s.isActive;

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);

  // Modal & Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copySessionId, setCopySessionId] = useState<string | null>(null);
  const [createInitialDate, setCreateInitialDate] = useState<string | undefined>(undefined);

  // Date Filter States
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);

  const hasActiveDateFilter = Boolean(fromDate || toDate);

  const fetchSessions = async () => {
    try {
      const result = await sessionService.getSessions({
        pageSize: 1000,
        ...(showActive !== null && { isActive: showActive }),
      });
      setSessions(result.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    sessionService
      .getSessions({
        pageSize: 1000,
        ...(showActive !== null && { isActive: showActive }),
      })
      .then((result) => {
        if (!cancelled) setSessions(result.items);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showActive]);

  const handleToggleActive = async (session: SessionListItem) => {
    const nextState = !session.isActive;
    const actionName = nextState ? "Mở (Bật)" : "Khóa (Tắt)";
    const result = await Swal.fire({
      title: `Xác nhận ${actionName.toLowerCase()} ca phục vụ?`,
      html: `Bạn có chắc chắn muốn <strong>${actionName.toLowerCase()}</strong> ca phục vụ <strong class="text-[#D35400]">"${session.name}"</strong> không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: nextState ? "#16a34a" : "#ea580c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: nextState ? "Mở hoạt động" : "Khóa hoạt động",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-200 shadow-2xl p-6",
        title: "text-xl font-black text-gray-900",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const detail = await sessionService.getSessionDetail(session.id);
      const payload = {
        id: detail.id,
        name: detail.name,
        description: detail.description,
        isActive: nextState,
        availableFrom: detail.availableFrom,
        availableTo: detail.availableTo,
        availableForOrder: detail.availableForOrder,
        ...(detail.finalizationDeadline
          ? { finalizationDeadline: detail.finalizationDeadline }
          : {}),
        autoFinalizePolicy: detail.autoFinalizePolicy ?? 0,
        mealTemplates: (detail.mealTemplates || []).map((t) => ({
          name: t.name,
          settings: t.settings.map((s) => ({
            categoryId: s.categoryId,
            minQuantity: s.minQuantity,
            maxQuantity: s.maxQuantity,
            isRequired: s.isRequired,
          })),
        })),
        dishes: (detail.dishes || []).map((d) => ({ dishId: d.dishId })),
      };

      await sessionService.updateSession(session.id, payload);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isActive: nextState } : s)),
      );
      toast.success(`Đã ${actionName.toLowerCase()} ca phục vụ "${session.name}" thành công!`);
    } catch (err: unknown) {
      console.error("Lỗi cập nhật trạng thái ca:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Cập nhật trạng thái ca thất bại.";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa ca phục vụ?",
      html: `Bạn có chắc chắn muốn xóa ca phục vụ <strong class="text-[#D35400]">"${name}"</strong> không?<br/><span class="text-xs text-gray-500 font-normal mt-1 block">Hành động này không thể hoàn tác.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa ca phục vụ",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-200 shadow-2xl p-6",
        title: "text-xl font-black text-gray-900",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await sessionService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success(`Đã xóa ca phục vụ "${name}" thành công!`);
    } catch (err: unknown) {
      console.error("Lỗi xóa ca phục vụ:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Xóa ca phục vụ thất bại. Ca phục vụ có thể đang chứa đơn hàng.";
      toast.error(msg);
    }
  };

  const handleOpenCreateForDate = (dateStr?: string) => {
    if (dateStr && dayjs(dateStr).isBefore(dayjs(), "day")) {
      toast.error("Không thể tạo ca ăn cho ngày trong quá khứ.");
      return;
    }
    setCopySessionId(null);
    setCreateInitialDate(dateStr);
    setIsCreateOpen(true);
  };

  const handleOpenCopy = (id: string) => {
    setCopySessionId(id);
    setCreateInitialDate(undefined);
    setIsCreateOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    router.push(`/manager/sessions/${id}`);
  };

  const filtered = sessions
    .filter((s) => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchesActive = showActive === null || isSessionLive(s) === showActive;

      let matchesDate = true;
      if (fromDate) {
        matchesDate =
          matchesDate && new Date(s.availableFrom || 0) >= new Date(`${fromDate}T00:00:00Z`);
      }
      if (toDate) {
        matchesDate =
          matchesDate && new Date(s.availableFrom || 0) <= new Date(`${toDate}T23:59:59Z`);
      }

      return matchesSearch && matchesActive && matchesDate;
    })
    .sort((a, b) => {
      const aLive = isSessionLive(a);
      const bLive = isSessionLive(b);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(b.availableFrom || 0).getTime() - new Date(a.availableFrom || 0).getTime();
    });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Ca phục vụ</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Quản lý và điều phối các phiên/ca ăn phục vụ.
        </p>
      </div>

      {/* Calendar Heatmap & Day Shift Inspector */}
      <SessionCalendarHeatmap
        sessions={sessions}
        onSelectDateToCreate={handleOpenCreateForDate}
        onOpenSessionDetails={handleOpenDetails}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto flex-1">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              placeholder="Tìm kiếm ca ăn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
            />
          </div>

          {/* Date Filter Dropdown Box Toggle */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
              className={cn(
                "w-full sm:w-auto px-5 py-3.5 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 border transition-all shadow-xs",
                hasActiveDateFilter
                  ? "bg-orange-50 border-orange-300 text-[#D35400]"
                  : "bg-white border-gray-200 text-gray-700 hover:border-orange-200 hover:text-[#D35400]",
              )}
            >
              <Filter className="w-4 h-4 text-[#D35400]" />
              <span>Lọc theo ngày</span>
              {hasActiveDateFilter && <span className="w-2 h-2 rounded-full bg-[#D35400]" />}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  showDateFilterDropdown && "rotate-180",
                )}
              />
            </button>

            {/* Dropdown Box Panel */}
            {showDateFilterDropdown && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-150 rounded-3xl shadow-2xl p-5 z-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#D35400]" /> Lọc ngày ca phục vụ
                  </span>
                  <button
                    onClick={() => setShowDateFilterDropdown(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Date Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Từ ngày</label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-800 outline-none w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Đến ngày</label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-800 outline-none w-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                    disabled={!hasActiveDateFilter}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-40 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    onClick={() => setShowDateFilterDropdown(false)}
                    className="px-4 py-2 bg-[#D35400] hover:bg-[#b04600] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex bg-gray-100/80 border border-gray-150 rounded-3xl p-1 shrink-0 w-full sm:w-auto">
          {[
            { label: "Tất cả", value: null },
            { label: "Hoạt động", value: true },
            { label: "Đã khóa", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setShowActive(opt.value)}
              className={cn(
                "flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-sm font-black transition-all uppercase tracking-wider text-center",
                showActive === opt.value
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách ca bán...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy ca phục vụ nào.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetails(session.id)}
              className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shadow-xs shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 truncate tracking-wide">
                    {session.name}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                      isSessionLive(session)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {isSessionLive(session) ? "Hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>

                {session.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 italic px-1">
                    📝 {session.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400 px-1 pt-1">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Bắt đầu: {formatDate(session.availableFrom)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Kết thúc: {formatDate(session.availableTo)}
                  </span>
                  <span className="font-bold text-[#D35400] bg-orange-50 border border-orange-100/40 rounded-xl px-2 py-0.5 text-xs">
                    {session.dishes?.length ?? 0} món
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(session);
                  }}
                  className={cn(
                    "p-3 rounded-2xl border transition-all shrink-0",
                    session.isActive
                      ? "text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border-green-200/80"
                      : "text-gray-400 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border-gray-200/80 hover:border-orange-100",
                  )}
                  title={session.isActive ? "Khóa (tắt) ca phục vụ" : "Mở (bật) ca phục vụ"}
                >
                  <Power className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCopy(session.id);
                  }}
                  className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all shrink-0"
                  title="Sao chép mẫu ca phục vụ"
                >
                  <Copy className="w-5 h-5" />
                </button>
                {!session.isFinalized && new Date(session.availableForOrder) > new Date() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(session.id);
                    }}
                    className="p-3 text-gray-400 hover:text-[#D35400] hover:bg-orange-50 rounded-2xl border border-transparent hover:border-orange-100 transition-all shrink-0"
                    title="Chỉnh sửa ca phục vụ"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(session.id, session.name);
                  }}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 transition-all shrink-0"
                  title="Xóa ca phục vụ"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE SESSION MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={copySessionId ? "Sao chép Ca phục vụ" : "Tạo Ca phục vụ mới"}
        size="full"
      >
        <NewSessionForm
          copyFromId={copySessionId}
          initialDate={createInitialDate}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchSessions();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
