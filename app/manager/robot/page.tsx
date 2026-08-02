"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  X,
  Cpu,
  Zap,
  AlertTriangle,
  Wrench,
  WifiOff,
  Clock,
  RefreshCw,
  Eye,
} from "lucide-react";
import { robotArmService } from "@/services/robot-arm.service";
import type {
  RobotArm,
  RobotArmDetail,
  RobotArmStatus,
  CreateRobotArmPayload,
  UpdateRobotArmPayload,
} from "@/types/robot-arm.types";
import Modal from "../_components/modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";

const STATUS_CONFIG: Record<
  RobotArmStatus,
  { label: string; dot: string; bg: string; text: string; border: string; icon: typeof Cpu }
> = {
  Idle: {
    label: "Rảnh",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    icon: Zap,
  },
  Busy: {
    label: "Đang hoạt động",
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/60",
    icon: Clock,
  },
  Error: {
    label: "Lỗi",
    dot: "bg-red-400",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200/60",
    icon: AlertTriangle,
  },
  Maintenance: {
    label: "Bảo trì",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200/60",
    icon: Wrench,
  },
  Offline: {
    label: "Mất kết nối",
    dot: "bg-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200/40",
    icon: WifiOff,
  },
};

const STATUS_ORDER: RobotArmStatus[] = ["Idle", "Busy", "Error", "Maintenance", "Offline"];

export default function ManagerRobotPage() {
  const [arms, setArms] = useState<RobotArm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRobotArmPayload>({
    code: "",
    ipAddress: "",
    stationIndex: 0,
    name: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateRobotArmPayload>({
    ipAddress: "",
    stationIndex: 0,
    name: "",
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArms = async () => {
    try {
      setError(null);
      const data = await robotArmService.getList();
      setArms(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(
          "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập bằng tài khoản Manager.",
        );
      } else if (status === 403) {
        setError("Tài khoản của bạn không có quyền truy cập chức năng này.");
      } else {
        setError("Không thể tải danh sách tay máy. Vui lòng thử lại.");
      }
      console.error(err);
    }
  };

  const [detailArm, setDetailArm] = useState<RobotArmDetail | null>(null);

  const handleOpenDetail = async (armId: string) => {
    const armFromList = arms.find((a) => a.id === armId);
    if (!armFromList) {
      toast.error("Không tìm thấy tay máy.");
      return;
    }
    try {
      const data = await robotArmService.getById(armId);
      setDetailArm(data);
    } catch {
      setDetailArm({
        ...armFromList,
        lanes: [],
        createdAtUtc: armFromList.lastHeartbeatUtc ?? "",
        updatedAtUtc: "",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchArms();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const openCreateModal = () => {
    setCreateForm({ code: "", ipAddress: "", stationIndex: 0, name: "" });
    setFormSubmitting(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.code.trim()) {
      toast.error("Code là bắt buộc.");
      return;
    }
    if (arms.some((a) => a.code.toLowerCase() === createForm.code.trim().toLowerCase())) {
      toast.error("Code đã tồn tại. Vui lòng dùng code khác.");
      return;
    }
    if (!createForm.name.trim()) {
      toast.error("Tên trạm là bắt buộc.");
      return;
    }
    if (arms.some((a) => a.name.toLowerCase() === createForm.name.trim().toLowerCase())) {
      toast.error("Tên trạm đã tồn tại. Vui lòng dùng tên khác.");
      return;
    }
    if (!createForm.ipAddress.trim()) {
      toast.error("IP Address là bắt buộc.");
      return;
    }

    setFormSubmitting(true);
    try {
      await robotArmService.create(createForm);
      setIsCreateOpen(false);
      toast.success("Đăng ký tay máy thành công!");
      fetchArms();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error(data?.message || "Đăng ký thất bại");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (arm: RobotArm) => {
    setEditId(arm.id);
    setEditForm({ ipAddress: arm.ipAddress, stationIndex: arm.stationIndex, name: arm.name });
    setFormSubmitting(false);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editId) return;
    if (!editForm.name.trim()) {
      toast.error("Tên trạm là bắt buộc.");
      return;
    }
    const duplicateName = arms.some(
      (a) => a.id !== editId && a.name.toLowerCase() === editForm.name.trim().toLowerCase(),
    );
    if (duplicateName) {
      toast.error("Tên trạm đã tồn tại. Vui lòng dùng tên khác.");
      return;
    }
    if (!editForm.ipAddress.trim()) {
      toast.error("IP Address là bắt buộc.");
      return;
    }

    setFormSubmitting(true);
    try {
      await robotArmService.update(editId, editForm);
      setIsEditOpen(false);
      toast.success("Cập nhật thành công!");
      fetchArms();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error(data?.message || "Cập nhật thất bại");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = (arm: RobotArm) => {
    Swal.fire({
      title: "Xoá tay máy?",
      html: `Bạn có chắc muốn xoá <strong>"${arm.name}"</strong> (${arm.code})?<br/>Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
      customClass: { popup: "rounded-3xl" },
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await robotArmService.delete(arm.id);
        setArms((prev) => prev.filter((a) => a.id !== arm.id));
        toast.success(`Đã xoá "${arm.name}"`);
      } catch (err: unknown) {
        const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
        toast.error(data?.message || "Xoá thất bại");
      }
    });
  };

  const filtered = arms.filter((arm) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      arm.code.toLowerCase().includes(q) ||
      arm.name.toLowerCase().includes(q) ||
      arm.ipAddress.toLowerCase().includes(q)
    );
  });

  const statusCounts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = arms.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<RobotArmStatus, number>,
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D35400] to-[#E86A33] flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Robot Arms</h1>
            <p className="text-base text-gray-500 mt-0.5">
              Đăng ký và giám sát các tay máy phục vụ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchArms().finally(() => setLoading(false));
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
              Đăng ký tay máy
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
          </button>
        </div>
      </div>

      {/* ── Status Overview Cards ── */}
      {!loading && arms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {STATUS_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const count = statusCounts[status];
            return (
              <div
                key={status}
                className={cn(
                  "rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between",
                  cfg.bg,
                  cfg.border,
                  "border",
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        cfg.dot,
                        (status === "Idle" || status === "Busy") && "animate-glow-pulse",
                      )}
                      style={
                        status === "Idle" || status === "Busy"
                          ? { color: status === "Idle" ? "#34d399" : "#fbbf24" }
                          : undefined
                      }
                    />
                    <span className={cn("text-sm font-bold", cfg.text)}>{cfg.label}</span>
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{count}</p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                    cfg.bg,
                    cfg.border,
                  )}
                >
                  <Icon className={cn("w-6 h-6", cfg.text)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Search ── */}
      <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Tìm theo code, tên, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 w-full rounded-2xl border border-gray-200/80 bg-gray-50/80 pl-14 pr-12 text-base font-semibold text-gray-700 outline-none transition-all focus:border-[#D35400] focus:bg-white focus:ring-2 focus:ring-[#D35400]/15 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
            <Cpu className="w-6 h-6 text-[#D35400] absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-base font-bold text-gray-500">Đang tải danh sách tay máy...</p>
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
              fetchArms().finally(() => setLoading(false));
            }}
            className="mt-4 px-5 py-2.5 bg-red-50 border border-red-200/60 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 p-20 text-center shadow-xs">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(211,84,0,0.03)_0%,transparent_70%)]" />
          <Cpu className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-lg">
            {search ? "Không tìm thấy tay máy phù hợp." : "Chưa có tay máy nào."}
          </p>
          <p className="text-gray-300 text-sm mt-1">
            {search
              ? "Thử từ khoá khác."
              : 'Nhấn "Đăng ký tay máy" để thêm tay robot mới vào hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Mã
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tên trạm
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    IP Address
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Station
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
                    Heartbeat
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((arm) => {
                  const s = STATUS_CONFIG[arm.status];
                  return (
                    <tr key={arm.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-5 py-4">
                        <code className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200/50 rounded-lg text-sm font-mono font-bold">
                          {arm.code}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-900">{arm.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                          {arm.ipAddress}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-600">
                          Trạm {arm.stationIndex}
                        </span>
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
                        {arm.lastHeartbeatUtc ? (
                          <span className="text-sm font-bold text-gray-600">
                            {new Date(arm.lastHeartbeatUtc).toLocaleString("vi-VN", {
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
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(arm.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#D35400] hover:text-white"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(arm)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#D35400] hover:text-white"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(arm)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-red-500 hover:text-white"
                            title="Xoá"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table footer */}
          <div className="border-t border-gray-100 px-8 py-5 bg-gray-50/50">
            <p className="text-base font-semibold text-gray-500">
              Hiển thị <span className="font-black text-gray-800">{filtered.length}</span> /{" "}
              <span className="font-black text-gray-800">{arms.length}</span> tay máy
            </p>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailArm && (
        <Modal
          isOpen={!!detailArm}
          onClose={() => setDetailArm(null)}
          title={`Chi tiết Tay Máy Robot ${detailArm.code} - ${detailArm.name}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl text-xs font-bold text-gray-700">
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Mã trạm</p>
                <p className="text-gray-900 text-sm font-black mt-0.5">{detailArm.code}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px]">IP Address</p>
                <p className="text-[#D35400] text-sm font-mono font-black mt-0.5">
                  {detailArm.ipAddress}
                </p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Vị trí trạm</p>
                <p className="text-gray-900 text-sm font-black mt-0.5">
                  Trạm {detailArm.stationIndex}
                </p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Trạng thái</p>
                <p className="text-emerald-700 text-sm font-black mt-0.5 uppercase">
                  {detailArm.status}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 bg-white border border-gray-100 p-4 rounded-2xl">
              <div>
                <span className="text-gray-400">Heartbeat gần nhất:</span>{" "}
                <span className="font-bold text-gray-800">
                  {detailArm.lastHeartbeatUtc
                    ? new Date(detailArm.lastHeartbeatUtc).toLocaleString("vi-VN")
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Ngày tạo:</span>{" "}
                <span className="font-bold text-gray-800">
                  {detailArm.createdAtUtc
                    ? new Date(detailArm.createdAtUtc).toLocaleString("vi-VN")
                    : "—"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Danh sách Lane phục vụ ({detailArm.lanes?.length || 0})
              </h4>
              {!detailArm.lanes || detailArm.lanes.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                  Tay máy này chưa được gán phụ trách Lane nào.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 font-black uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-3">Mã Lane</th>
                        <th className="px-4 py-3">Món ăn</th>
                        <th className="px-4 py-3">Sức chứa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold">
                      {detailArm.lanes.map((lane, idx) => (
                        <tr key={lane.slotConfigurationId || idx} className="hover:bg-orange-50/20">
                          <td className="px-4 py-3 font-mono text-[#D35400]">{lane.laneCode}</td>
                          <td className="px-4 py-3 text-gray-900">{lane.dishName || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{lane.capacity} khay</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Đăng ký tay máy mới"
        size="lg"
      >
        <RobotArmForm
          form={createForm}
          onChange={(f) => setCreateForm({ ...createForm, ...f })}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          submitting={formSubmitting}
          mode="create"
        />
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Chỉnh sửa tay máy"
        size="lg"
      >
        {editId && (
          <RobotArmForm
            form={editForm}
            onChange={(f) => setEditForm({ ...editForm, ...f })}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditOpen(false)}
            submitting={formSubmitting}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}

// ─── RobotArmForm Component ───

function RobotArmForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  mode,
}: {
  form: CreateRobotArmPayload | UpdateRobotArmPayload;
  onChange: (fields: Record<string, string | number>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  mode: "create" | "edit";
}) {
  return (
    <div className="space-y-6">
      {mode === "create" && (
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Code <span className="text-red-400">*</span>
          </label>
          <input
            value={(form as CreateRobotArmPayload).code || ""}
            onChange={(e) => onChange({ code: e.target.value })}
            placeholder="VD: S1, S2, ARM-01"
            className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
          />
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Định danh duy nhất, không thể đổi sau khi tạo
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">
          Tên trạm <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="VD: Trạm cơm, Trạm mặn"
          className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            IP Address <span className="text-red-400">*</span>
          </label>
          <input
            value={form.ipAddress || ""}
            onChange={(e) => onChange({ ipAddress: e.target.value })}
            placeholder="VD: 192.168.58.2"
            className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono transition-all shadow-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Station Index <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            value={form.stationIndex ?? 0}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              if (raw === "") {
                onChange({ stationIndex: 0 });
                return;
              }
              onChange({ stationIndex: parseInt(raw, 10) || 0 });
            }}
            placeholder="VD: 0, 1, 2"
            className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
          />
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Vị trí trên băng chuyền (bắt đầu từ 0)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-xs"
        >
          Huỷ
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="relative overflow-hidden group px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="relative z-10 flex items-center gap-2.5 justify-center">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : mode === "create" ? (
              <>
                <Plus className="w-4 h-4" />
                Đăng ký
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </span>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
        </button>
      </div>
    </div>
  );
}
