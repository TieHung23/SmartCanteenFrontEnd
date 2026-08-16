"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Eye,
  Activity,
  Search,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { servingJobService } from "@/services/serving-job.service";
import { sessionService } from "@/services/session.service";
import type { ServingJob, ServingJobStatus } from "@/types/serving-job.types";
import ServingJobEventsModal from "./serving-job-events-modal";
import Modal from "@/app/manager/_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";

const STATUS_CONFIG: Record<
  ServingJobStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  Queued: {
    label: "Chờ gắp",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/60",
  },
  Pushed: {
    label: "Đã giao robot",
    dot: "bg-indigo-400",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200/60",
  },
  Assembling: {
    label: "Đang ráp khay",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
  },
  OnShelf: {
    label: "Đã lên kệ",
    dot: "bg-purple-400",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200/60",
  },
  Collected: {
    label: "Đã lấy món",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
  },
  Failed: {
    label: "Lỗi",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200/60",
  },
  Cancelled: {
    label: "Đã hủy",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200/60",
  },
};

const STATUS_OPTIONS: { value: ServingJobStatus | "All"; label: string }[] = [
  { value: "Failed", label: "Lỗi (Cần cứu)" },
  { value: "All", label: "Tất cả trạng thái" },
  { value: "Queued", label: "Chờ gắp" },
  { value: "Pushed", label: "Đã giao robot" },
  { value: "Assembling", label: "Đang ráp khay" },
  { value: "OnShelf", label: "Đã lên kệ" },
  { value: "Collected", label: "Đã lấy món" },
  { value: "Cancelled", label: "Đã hủy" },
];

export function ServingJobsSection({
  className,
  sessionId,
}: {
  className?: string;
  sessionId?: string;
}) {
  const [jobs, setJobs] = useState<ServingJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<ServingJobStatus | "All">("Failed");
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessionId || "");
  const [sessionsList, setSessionsList] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  // Manual Complete Modal state
  const [manualModalJob, setManualModalJob] = useState<ServingJob | null>(null);
  const [manualNote, setManualNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (sessionId) return;
    sessionService
      .getSessions({ pageSize: 100 })
      .then((res) => {
        if (res?.items) {
          setSessionsList(res.items.map((s) => ({ id: s.id, name: s.name || "Phiên ăn" })));
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const res = await servingJobService.getList(
        selectedStatus,
        100,
        sessionId || selectedSessionId || undefined,
      );
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      console.error("Failed to fetch serving jobs:", err);
      setError("Không thể tải danh sách serving jobs.");
    }
  }, [selectedStatus, selectedSessionId, sessionId]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchJobs();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchJobs]);

  const handleOpenEvents = (job: ServingJob) => {
    setDetailJobId(job.jobId);
    setDetailOrderId(job.orderId);
    setIsEventsOpen(true);
  };

  const handleRequeue = async (job: ServingJob) => {
    const result = await Swal.fire({
      title: "Cho robot làm lại?",
      html: `Robot sẽ thực hiện lại việc gắp phần còn thiếu cho đơn <strong class="text-[#D35400]">${job.orderId.slice(0, 8)}...</strong> (khay: ${job.trayCode || "N/A"}).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận Làm lại",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      customClass: { popup: "rounded-3xl" },
    });

    if (!result.isConfirmed) return;

    try {
      await servingJobService.requeue(job.jobId);
      toast.success(`Đã yêu cầu robot làm lại job ${job.orderId.slice(0, 8)}...`);
      fetchJobs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Không thể thực hiện làm lại job.");
    }
  };

  const handleOpenManualModal = (job: ServingJob) => {
    setManualModalJob(job);
    setManualNote("Staff đặt bổ sung phần thiếu");
  };

  const handleManualSubmit = async () => {
    if (!manualModalJob) return;
    setManualSubmitting(true);
    try {
      await servingJobService.manualComplete(manualModalJob.jobId, { note: manualNote.trim() });
      toast.success(
        `Đã xác nhận đặt tay hoàn tất cho đơn ${manualModalJob.orderId.slice(0, 8)}...`,
      );
      setManualModalJob(null);
      fetchJobs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Không thể xác nhận đặt tay.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.jobId.toLowerCase().includes(q) ||
      j.orderId.toLowerCase().includes(q) ||
      (j.trayCode && j.trayCode.toLowerCase().includes(q)) ||
      (j.failureReason && j.failureReason.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className={cn(
        "space-y-6 bg-white border border-gray-100/80 rounded-2xl p-6 shadow-xs",
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D35400] to-[#E86A33] flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-gray-900">Serving Jobs Dashboard</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#D35400] border border-orange-200/60 text-xs font-bold font-mono">
                {total} jobs
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi tiến trình robot gắp món và thực hiện cứu job khi bị lỗi (Requeue / Manual
              Complete)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchJobs().finally(() => setLoading(false));
            }}
            className="p-2.5 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-2xs active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            const count =
              opt.value === "All" ? jobs.length : jobs.filter((j) => j.status === opt.value).length;

            return (
              <button
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                  isSelected
                    ? "bg-[#D35400] text-white border-[#D35400] shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200/80",
                )}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[10px] font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Session Filter */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Session Dropdown Filter (Chỉ hiển thị ở trang chính Serving Jobs) */}
          {!sessionId && (
            <div className="relative w-full sm:w-56 shrink-0">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D35400]" />
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 font-bold transition-all cursor-pointer"
              >
                <option value="">-- Tất cả Ca / Phiên ăn --</option>
                {sessionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Tìm theo mã đơn, khay, lỗi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table / Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin text-[#D35400]" />
          <p className="text-xs font-bold">Đang tải dữ liệu serving jobs...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center text-xs font-bold">
          {error}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">Không có serving job nào phù hợp.</p>
          <p className="text-xs text-gray-400 mt-1">
            {selectedStatus === "Failed"
              ? "Tuyệt vời! Hiện tại không có job nào bị lỗi."
              : "Thử chọn trạng thái khác hoặc xóa từ khóa tìm kiếm."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3.5">Mã đơn hàng</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Mã khay</th>
                  <th className="px-4 py-3.5">Lý do sự cố</th>
                  <th className="px-4 py-3.5">Thời gian tạo</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredJobs.map((job) => {
                  const cfg = STATUS_CONFIG[job.status] || {
                    label: job.status,
                    dot: "bg-gray-400",
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    border: "border-gray-200",
                  };
                  const isFailed = job.status === "Failed";

                  return (
                    <tr
                      key={job.jobId}
                      className={cn(
                        "hover:bg-orange-50/20 transition-colors",
                        isFailed && "bg-red-50/30 hover:bg-red-50/50",
                      )}
                    >
                      {/* Order Code */}
                      <td className="px-4 py-3.5">
                        <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md font-mono font-bold text-xs border border-gray-200/60">
                          {job.orderId.slice(0, 8)}...
                        </code>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                            cfg.bg,
                            cfg.text,
                            cfg.border,
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Tray */}
                      <td className="px-4 py-3.5">
                        {job.trayCode ? (
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-[#D35400] font-mono font-bold border border-orange-200/50">
                            {job.trayCode}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Failure Reason */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {job.failureReason ? (
                          <span
                            className="text-red-600 font-medium truncate block font-mono text-[11px]"
                            title={job.failureReason}
                          >
                            {job.failureReason}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">—</span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px]">
                        {new Date(job.createdAtUtc).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Timeline / Details Button */}
                          <button
                            onClick={() => handleOpenEvents(job)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-2xs"
                            title="Xem lịch sử sự kiện (Timeline)"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Chi tiết</span>
                          </button>

                          {/* Requeue Button (Failed only) */}
                          {isFailed && (
                            <button
                              onClick={() => handleRequeue(job)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-2xs"
                              title="Yêu cầu robot gắp lại phần thiếu (Giữ khay)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Làm lại</span>
                            </button>
                          )}

                          {/* Manual Complete Button (Failed only) */}
                          {isFailed && (
                            <button
                              onClick={() => handleOpenManualModal(job)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#D35400] hover:bg-[#b04600] text-white font-bold rounded-xl transition-all shadow-2xs"
                              title="Staff đặt tay bổ sung phần thiếu -> Chuyển Assembling"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đặt tay xong</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Events Timeline Modal ── */}
      <ServingJobEventsModal
        isOpen={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        jobId={detailJobId}
        orderId={detailOrderId}
      />

      {/* ── Manual Complete Note Modal ── */}
      {manualModalJob && (
        <Modal
          isOpen={Boolean(manualModalJob)}
          onClose={() => setManualModalJob(null)}
          title="Xác nhận Staff đặt tay xong"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-orange-50 border border-orange-200/60 rounded-xl text-xs text-orange-800">
              <p className="font-bold">
                Xác nhận đã đặt tay bổ sung món ăn còn thiếu cho đơn{" "}
                <span className="font-mono">{manualModalJob.orderId.slice(0, 8)}...</span>.
              </p>
              <p className="mt-1">
                Job sẽ chuyển sang trạng thái <strong>Assembling (Đang ráp khay)</strong> để đủ điều
                kiện đẩy lên kệ pickup.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Ghi chú của Staff (Tuỳ chọn)
              </label>
              <textarea
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="VD: Thay hộp bị đổ / đã xếp đủ 2 phần cơm"
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setManualModalJob(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={manualSubmitting}
                className="px-5 py-2 bg-[#D35400] hover:bg-[#b04600] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {manualSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Xác nhận Hoàn thành
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
