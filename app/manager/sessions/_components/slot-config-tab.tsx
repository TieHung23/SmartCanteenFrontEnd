"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Route,
  Cpu,
  ArrowUpDown,
  AlertTriangle,
  Package,
  Layers,
  Eye,
} from "lucide-react";
import { slotConfigurationService } from "@/services/slot-configuration.service";
import { robotArmService } from "@/services/robot-arm.service";
import { trayService } from "@/services/tray.service";
import { pickupSlotService } from "@/services/pickup-slot.service";
import type {
  SlotConfiguration,
  SlotConfigurationDetail,
  CreateSlotConfigurationPayload,
  UpdateSlotConfigurationPayload,
} from "@/types/slot-configuration.types";
import type { SessionDishInfo } from "@/types/session.types";
import type { RobotArm, RobotArmDetail } from "@/types/robot-arm.types";
import type { TrayPoolSummary } from "@/types/tray.types";
import type { PickupSlotSummary } from "@/types/pickup-slot.types";
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
  const [traysPool, setTraysPool] = useState<TrayPoolSummary | null>(null);
  const [slotsPool, setSlotsPool] = useState<PickupSlotSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlotConfiguration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailArm, setDetailArm] = useState<RobotArmDetail | null>(null);
  const [detailLane, setDetailLane] = useState<SlotConfigurationDetail | null>(null);

  const handleOpenArmDetail = async (armId: string) => {
    try {
      const data = await robotArmService.getById(armId, sessionId);
      setDetailArm(data);
    } catch {
      toast.error("Không thể tải chi tiết tay máy robot.");
    }
  };

  const handleOpenLaneDetail = async (configId: string) => {
    try {
      const data = await slotConfigurationService.getById(configId);
      setDetailLane(data);
    } catch {
      toast.error("Không thể tải chi tiết cấu hình lane.");
    }
  };

  const [formDishId, setFormDishId] = useState("");
  const [formLaneCode, setFormLaneCode] = useState("");
  const [formCapacity, setFormCapacity] = useState(12);
  const [formRobotArmId, setFormRobotArmId] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [configsData, armsData, traysData, slotsData] = await Promise.all([
        slotConfigurationService.getBySession(sessionId),
        robotArmService.getList(sessionId).catch(() => [] as RobotArm[]),
        trayService.getPool().catch(() => null),
        pickupSlotService.getList().catch(() => null),
      ]);
      setConfigs(configsData);
      setRobotArms(armsData);
      setTraysPool(traysData);
      setSlotsPool(slotsData);
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
    <div className="space-y-8">
      {/* Overview Cards for Robot Arms, Trays, Pickup Slots in this session */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Robot Arms Status Box */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-[#D35400]" />
              <h4 className="text-base font-black text-gray-900">
                Tay máy Robot ({robotArms.length})
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              Hoạt động
            </span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {robotArms.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Chưa có Robot arm nào.</p>
            ) : (
              robotArms.map((arm) => (
                <div
                  key={arm.id}
                  onClick={() => handleOpenArmDetail(arm.id)}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-bold cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all"
                  title="Nhấn để xem chi tiết tay máy robot"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-gray-900 font-black">{arm.name || arm.code}</p>
                      <p className="text-[10px] text-gray-400">
                        IP: {arm.ipAddress || "192.168.1.x"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      {arm.status || "Idle"}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trays Summary Box */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-orange-500" />
              <h4 className="text-base font-black text-gray-900">Khay phục vụ (Trays)</h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">
              Pool
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-orange-50/60 border border-orange-200/60 rounded-2xl p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase">Khay sẵn sàng</p>
              <p className="text-xl font-black text-[#D35400] mt-1">{traysPool?.available ?? 0}</p>
            </div>
            <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase">Đang sử dụng</p>
              <p className="text-xl font-black text-blue-600 mt-1">{traysPool?.inUse ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Pickup Slots Summary Box */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-600" />
              <h4 className="text-base font-black text-gray-900">Ô Kệ (Pickup Slots)</h4>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
              Kệ lấy đồ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase">Ô trống</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{slotsPool?.empty ?? 0}</p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase">Đang có khay</p>
              <p className="text-xl font-black text-amber-700 mt-1">{slotsPool?.occupied ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header & Table for Lane Configuration */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Route className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Cấu hình Lane & Tay máy ({configs.length})
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Gán từng món ăn vào Lane (`S1_L1` .. `S3_L3`), sức chứa tối đa và Robot Arm phụ
                trách.
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D35400] text-white text-sm font-black rounded-xl shadow-md hover:bg-[#b04600] transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm cấu hình Lane
          </button>
        </div>

        {/* Empty state */}
        {configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Route className="w-7 h-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-400">Chưa có cấu hình lane nào</p>
              <p className="text-sm text-gray-400 mt-1">
                Bấm &quot;Thêm cấu hình Lane&quot; để gán món ăn vào lane
              </p>
            </div>
          </div>
        ) : (
          /* Config Table */
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                      Món ăn
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                      Lane Code
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                      Sức chứa (Khay)
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-400">
                      Tay máy Robot
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-gray-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configs.map((config) => {
                    const dish = dishes.find((d) => d.dishId === config.dishId);
                    const arm = robotArms.find((a) => a.id === config.robotArmId);
                    return (
                      <tr key={config.id} className="transition-colors hover:bg-orange-50/20">
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
                                  {dish.priceAmount.toLocaleString("vi-VN")} đ
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
                          <span className="text-sm font-black text-gray-900">
                            {config.capacity}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">phần</span>
                        </td>
                        <td className="px-5 py-4">
                          {arm ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700">
                              <Cpu className="w-3.5 h-3.5" />
                              {arm.name || arm.code}
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
                              onClick={() => handleOpenLaneDetail(config.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-[#D35400] hover:text-white"
                              title="Xem chi tiết Lane"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
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
      </div>

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
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#D35400] text-gray-900 text-sm font-bold transition-all shadow-xs"
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

          {/* Lane Code & Tay Máy */}
          {(() => {
            const allLanes =
              robotArms.length > 0
                ? robotArms.flatMap((arm) => {
                    const code = (arm.code || "S1").toUpperCase();
                    return [`${code}_L1`, `${code}_L2`, `${code}_L3`];
                  })
                : ["S1_L1", "S1_L2", "S1_L3", "S2_L1", "S2_L2", "S2_L3", "S3_L1", "S3_L2", "S3_L3"];

            const selectedArm = robotArms.find((a) => a.id === formRobotArmId);
            const availableLanes = selectedArm
              ? [
                  `${selectedArm.code.toUpperCase()}_L1`,
                  `${selectedArm.code.toUpperCase()}_L2`,
                  `${selectedArm.code.toUpperCase()}_L3`,
                ]
              : allLanes;

            return (
              <>
                {/* Lane Code */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Mã Lane <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formLaneCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormLaneCode(val);
                      const prefix = val.split("_")[0];
                      const matchingArm = robotArms.find(
                        (a) => (a.code || "").toUpperCase() === prefix,
                      );
                      if (matchingArm) {
                        setFormRobotArmId(matchingArm.id);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#D35400] text-gray-900 font-mono font-bold text-sm transition-all shadow-xs"
                  >
                    <option value="">-- Chọn Mã Lane --</option>
                    {availableLanes.map((lane) => (
                      <option key={lane} value={lane}>
                        {lane}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">
                    Tự động gợi ý mã Lane tương ứng theo trạm robot (S1_L1..3, S2_L1..3, S3_L1..3).
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
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#D35400] text-gray-900 transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Tay máy (tùy chọn)
                    </label>
                    <select
                      value={formRobotArmId}
                      onChange={(e) => {
                        const armId = e.target.value;
                        setFormRobotArmId(armId);
                        const arm = robotArms.find((a) => a.id === armId);
                        if (arm) {
                          setFormLaneCode(`${arm.code.toUpperCase()}_L1`);
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#D35400] text-gray-900 text-sm font-bold transition-all shadow-xs"
                    >
                      <option value="">-- Không gán --</option>
                      {robotArms.map((arm) => (
                        <option key={arm.id} value={arm.id}>
                          {arm.name ? `${arm.code} - ${arm.name}` : arm.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-5 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D35400] hover:bg-[#b04600] text-white text-sm font-black rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : editingConfig ? "Cập nhật" : "Tạo cấu hình"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── ROBOT ARM DETAIL MODAL ── */}
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
                  Tay máy này chưa được gán phục trách Lane nào.
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

      {/* ── LANE DETAIL MODAL ── */}
      {detailLane && (
        <Modal
          isOpen={!!detailLane}
          onClose={() => setDetailLane(null)}
          title={`Chi tiết Cấu hình Lane ${detailLane.laneCode}`}
          size="md"
        >
          <div className="space-y-5 text-sm">
            <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Mã Lane:</span>
                <span className="font-mono font-black text-base text-[#D35400] bg-white px-3 py-1 rounded-xl border border-orange-200">
                  {detailLane.laneCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Ca phục vụ:</span>
                <span className="font-bold text-gray-900">{detailLane.sessionName || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Món ăn:</span>
                <span className="font-bold text-gray-900">{detailLane.dishName || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Sức chứa:</span>
                <span className="font-bold text-gray-900">{detailLane.capacity} khay</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Tay máy phục vụ:</span>
                <span className="font-bold text-blue-700">
                  {detailLane.robotArmName || detailLane.robotArmCode || "Tự phục vụ"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">Ngày khởi tạo</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {detailLane.createdAtUtc
                    ? new Date(detailLane.createdAtUtc).toLocaleString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold">Cập nhật lần cuối</p>
                <p className="font-bold text-gray-800 mt-0.5">
                  {detailLane.updatedAtUtc
                    ? new Date(detailLane.updatedAtUtc).toLocaleString("vi-VN")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
