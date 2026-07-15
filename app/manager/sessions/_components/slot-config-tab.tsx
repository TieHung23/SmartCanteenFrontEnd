"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Route, Cpu, ArrowUpDown, AlertTriangle } from "lucide-react";
import { slotConfigurationService } from "@/services/slot-configuration.service";
import { robotArmService } from "@/services/robot-arm.service";
import type {
  SlotConfiguration,
  CreateSlotConfigurationPayload,
  UpdateSlotConfigurationPayload,
} from "@/types/slot-configuration.types";
import type { SessionDishInfo } from "@/types/session.types";
import type { RobotArm } from "@/types/robot-arm.types";
import Modal from "../../_components/modal";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface SlotConfigTabProps {
  sessionId: string;
  dishes: SessionDishInfo[];
}

export function SlotConfigTab({ sessionId, dishes }: SlotConfigTabProps) {
  const [configs, setConfigs] = useState<SlotConfiguration[]>([]);
  const [robotArms, setRobotArms] = useState<RobotArm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlotConfiguration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formDishId, setFormDishId] = useState("");
  const [formLaneCode, setFormLaneCode] = useState("");
  const [formCapacity, setFormCapacity] = useState(12);
  const [formRobotArmId, setFormRobotArmId] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [configsData, armsData] = await Promise.all([
        slotConfigurationService.getBySession(sessionId),
        robotArmService.getList().catch(() => [] as RobotArm[]),
      ]);
      setConfigs(configsData);
      setRobotArms(armsData);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền truy cập chức năng này.");
      } else {
        setError("Không thể tải cấu hình slot. Vui lòng thử lại.");
      }
      console.error(err);
    }
  }, [sessionId]);

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
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingConfig(null);
    setFormDishId(dishes[0]?.dishId || "");
    setFormLaneCode("");
    setFormCapacity(12);
    setFormRobotArmId("");
    setIsModalOpen(true);
  };

  const openEditModal = (config: SlotConfiguration) => {
    setEditingConfig(config);
    setFormDishId(config.dishId);
    setFormLaneCode(config.laneCode);
    setFormCapacity(config.capacity);
    setFormRobotArmId(config.robotArmId || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formDishId) {
      toast.error("Vui lòng chọn món ăn.");
      return;
    }
    if (!formLaneCode.trim()) {
      toast.error("Mã lane không được để trống.");
      return;
    }
    if (formCapacity <= 0) {
      toast.error("Sức chứa phải lớn hơn 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingConfig) {
        const payload: UpdateSlotConfigurationPayload = {
          dishId: formDishId,
          laneCode: formLaneCode.trim(),
          capacity: formCapacity,
          robotArmId: formRobotArmId || null,
        };
        await slotConfigurationService.update(editingConfig.id, payload);
        toast.success("Cập nhật cấu hình thành công!");
      } else {
        const payload: CreateSlotConfigurationPayload = {
          sessionId,
          dishId: formDishId,
          laneCode: formLaneCode.trim(),
          capacity: formCapacity,
          robotArmId: formRobotArmId || null,
        };
        await slotConfigurationService.create(payload);
        toast.success("Tạo cấu hình thành công!");
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string; error?: string; message?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as Error).message ||
        "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (config: SlotConfiguration) => {
    const dishName = dishes.find((d) => d.dishId === config.dishId)?.dishName || config.dishId;
    Swal.fire({
      title: "Xoá cấu hình?",
      html: `Gỡ món <strong>${dishName}</strong> khỏi lane <strong>${config.laneCode}</strong>?`,
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
        await slotConfigurationService.delete(config.id);
        setConfigs((prev) => prev.filter((c) => c.id !== config.id));
        toast.success("Đã xoá cấu hình.");
      } catch (err: unknown) {
        const msg = (err as Error).message || "Xoá thất bại";
        toast.error(msg);
      }
    });
  };

  const usedDishIds = new Set(
    configs.filter((c) => c.id !== editingConfig?.id).map((c) => c.dishId),
  );

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-base font-bold text-gray-500 text-center max-w-md">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData().finally(() => setLoading(false));
          }}
          className="px-5 py-2.5 bg-[#D35400] text-white text-sm font-bold rounded-xl hover:bg-[#b04600] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <Route className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Cấu hình Lane ({configs.length})</h3>
            <p className="text-xs text-gray-400 font-medium">
              Gán mỗi món vào 1 lane — mỗi lane 1 món / ca
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white text-sm font-black rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm cấu hình
        </button>
      </div>

      {/* Empty state */}
      {configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Route className="w-7 h-7 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-400">Chưa có cấu hình nào</p>
            <p className="text-sm text-gray-400 mt-1">
              Bấm &quot;Thêm cấu hình&quot; để gán món vào lane
            </p>
          </div>
        </div>
      ) : (
        /* Config Table */
        <div className="rounded-2xl border border-gray-100/80 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                    Món ăn
                  </th>
                  <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                    Lane Code
                  </th>
                  <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                    Sức chứa
                  </th>
                  <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                    Tay máy
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {configs.map((config, idx) => {
                  const dish = dishes.find((d) => d.dishId === config.dishId);
                  const arm = robotArms.find((a) => a.id === config.robotArmId);
                  return (
                    <tr
                      key={config.id}
                      className="transition-colors hover:bg-orange-50/20 animate-fade-in"
                      style={{ animationDelay: `${idx * 30}ms` } as React.CSSProperties}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-sm shrink-0">
                            🍽️
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {dish?.dishName || config.dishId.slice(0, 8)}
                            </p>
                            {dish?.priceAmount !== undefined && (
                              <p className="text-[10px] text-[#D35400] font-bold">
                                {dish.priceAmount} điểm
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-50 border border-violet-100 text-sm font-black text-violet-700 font-mono">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          {config.laneCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-black text-gray-900">{config.capacity}</span>
                        <span className="text-xs text-gray-400 ml-1">phần</span>
                      </td>
                      <td className="px-5 py-4">
                        {arm ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700">
                            <Cpu className="w-3.5 h-3.5" />
                            {arm.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-medium">
                            Tự phục vụ
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(config)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-[#D35400]/10 hover:text-[#D35400]"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(config)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
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
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConfig ? "Sửa cấu hình lane" : "Thêm cấu hình lane"}
        size="lg"
      >
        <div className="space-y-5">
          {/* Dish selector */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Món ăn <span className="text-red-400">*</span>
            </label>
            <select
              value={formDishId}
              onChange={(e) => setFormDishId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 text-sm font-bold transition-all shadow-xs"
            >
              <option value="">-- Chọn món --</option>
              {dishes.map((d) => {
                const isUsed = usedDishIds.has(d.dishId) && d.dishId !== formDishId;
                return (
                  <option key={d.dishId} value={d.dishId} disabled={isUsed}>
                    {d.dishName || d.dishId.slice(0, 8)}
                    {isUsed ? " (đã có cấu hình)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Lane Code */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Lane Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formLaneCode}
              onChange={(e) => setFormLaneCode(e.target.value.toUpperCase())}
              placeholder="VD: S1-L2, S2-L1"
              className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
            />
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Mã định danh lane trên băng chuyền
            </p>
          </div>

          {/* Capacity + Robot Arm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Sức chứa <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                value={formCapacity}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  if (raw === "") {
                    setFormCapacity(0);
                    return;
                  }
                  setFormCapacity(parseInt(raw, 10) || 0);
                }}
                placeholder="VD: 12, 20"
                className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
              />
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                Số phần tối đa trên lane này
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Tay máy (tùy chọn)
              </label>
              <select
                value={formRobotArmId}
                onChange={(e) => setFormRobotArmId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200/50 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 text-sm font-bold transition-all shadow-xs"
              >
                <option value="">-- Không gán --</option>
                {robotArms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.code} — {arm.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">Để trống nếu tự phục vụ</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-5 py-3 border border-gray-200/60 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D35400] to-[#E86A33] text-white text-sm font-black rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : editingConfig ? (
                "Lưu thay đổi"
              ) : (
                "Tạo cấu hình"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
