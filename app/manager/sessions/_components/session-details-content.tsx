"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  UtensilsCrossed,
  Layers,
  Tag,
  Coffee,
  AlertCircle,
  Pencil,
  Save,
  Trash2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import { dishService } from "@/services/dish.service";
import type { SessionDetail } from "@/types/session.types";
import type { Category } from "@/types/category.types";
import type { Dish } from "@/types/dish.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface SessionDetailsContentProps {
  sessionId: string;
  onClose: () => void;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

export function SessionDetailsContent({ sessionId, onClose }: SessionDetailsContentProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAvailableFrom, setEditAvailableFrom] = useState("");
  const [editAvailableTo, setEditAvailableTo] = useState("");
  const [editAvailableForOrder, setEditAvailableForOrder] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editTemplateSettings, setEditTemplateSettings] = useState<
    { categoryId: string; minQuantity: number; maxQuantity: number; isRequired: boolean }[]
  >([]);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editDishIds, setEditDishIds] = useState<Set<string>>(new Set());
  const [dishSearch, setDishSearch] = useState("");

  const [preparedQuantities, setPreparedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const [sessionData, catResult, dishResult] = await Promise.all([
        sessionService.getSessionDetail(sessionId),
        categoryService.getAll().catch(() => ({ items: [] as Category[] })),
        dishService
          .getDishes({ isActive: true, pageSize: 200 })
          .catch(() => ({ items: [] as Dish[] })),
      ]);
      setSession(sessionData);
      setCategories(catResult.items);
      setAllDishes(dishResult.items);

      const initialQs: Record<string, number> = {};
      (sessionData.dishes || []).forEach((d) => {
        initialQs[d.dishId] = d.preparedQuantity ?? 0;
      });
      setPreparedQuantities(initialQs);

      setEditName(sessionData.name);
      setEditDescription(sessionData.description);
      setEditAvailableFrom(toDatetimeLocal(sessionData.availableFrom));
      setEditAvailableTo(toDatetimeLocal(sessionData.availableTo));
      setEditAvailableForOrder(toDatetimeLocal(sessionData.availableForOrder));
      setEditDeadline(toDatetimeLocal(sessionData.finalizationDeadline));

      const tpl = sessionData.mealTemplates?.[0];
      if (tpl) {
        setEditTemplateName(tpl.name);
        setEditTemplateSettings(
          tpl.settings.map((s) => ({
            categoryId: s.categoryId,
            minQuantity: s.minQuantity,
            maxQuantity: s.maxQuantity,
            isRequired: s.isRequired,
          })),
        );
      }

      setEditDishIds(new Set(sessionData.dishes.map((d) => d.dishId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session details");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession();
  }, [loadSession]);

  const enterEditMode = () => {
    if (!session) return;
    setEditName(session.name);
    setEditDescription(session.description);
    setEditAvailableFrom(toDatetimeLocal(session.availableFrom));
    setEditAvailableTo(toDatetimeLocal(session.availableTo));
    setEditAvailableForOrder(toDatetimeLocal(session.availableForOrder));
    setEditDeadline(toDatetimeLocal(session.finalizationDeadline));
    const tpl = session.mealTemplates?.[0];
    if (tpl) {
      setEditTemplateName(tpl.name);
      setEditTemplateSettings(
        tpl.settings.map((s) => ({
          categoryId: s.categoryId,
          minQuantity: s.minQuantity,
          maxQuantity: s.maxQuantity,
          isRequired: s.isRequired,
        })),
      );
    }
    setEditDishIds(new Set(session.dishes.map((d) => d.dishId)));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!session) return;

    if (!editName.trim()) {
      toast.error("Tên ca phục vụ không được để trống.");
      return;
    }
    if (!editAvailableFrom || !editAvailableTo || !editAvailableForOrder) {
      toast.error("Vui lòng nhập đầy đủ thời gian.");
      return;
    }
    if (new Date(editAvailableFrom) >= new Date(editAvailableTo)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    if (editDishIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một món ăn.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim(),
        availableFrom: new Date(editAvailableFrom).toISOString(),
        availableTo: new Date(editAvailableTo).toISOString(),
        availableForOrder: new Date(editAvailableForOrder).toISOString(),
        ...(editDeadline ? { finalizationDeadline: new Date(editDeadline).toISOString() } : {}),
        mealTemplates: [
          {
            name: editTemplateName.trim() || "Suất chuẩn",
            settings: editTemplateSettings,
          },
        ],
        dishes: Array.from(editDishIds).map((dishId) => ({ dishId })),
      };

      await sessionService.updateSession(session.id, payload);
      toast.success("Cập nhật ca phục vụ thành công!");
      setIsEditing(false);
      await loadSession();
    } catch (err) {
      toast.error("Lỗi khi cập nhật ca phục vụ.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuantityChange = (dishId: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    setPreparedQuantities((prev) => ({
      ...prev,
      [dishId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleFinalize = async () => {
    if (!session) return;

    const result = await Swal.fire({
      title: "Chốt ca phục vụ?",
      text: "Bạn có chắc chắn muốn chốt số lượng cho ca phục vụ này? Hành động này sẽ khóa ca bán và tự động tạo đề xuất đổi món/hoàn tiền cho các đơn hàng bị thiếu.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Chốt ca ăn",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-200 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const preparedDishes = (session.dishes || []).map((d) => ({
        dishId: d.dishId,
        preparedQuantity: preparedQuantities[d.dishId] ?? 0,
      }));

      await sessionService.finalizeSession(session.id, preparedDishes);
      toast.success("Chốt số lượng món ăn phục vụ thành công!");
      await loadSession();
    } catch {
      toast.error("Lỗi khi thực hiện chốt đơn ca phục vụ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTemplateSettingCategory = (categoryId: string) => {
    setEditTemplateSettings((prev) => {
      const exists = prev.find((s) => s.categoryId === categoryId);
      if (exists) {
        return prev.filter((s) => s.categoryId !== categoryId);
      }
      return [...prev, { categoryId, minQuantity: 0, maxQuantity: 10, isRequired: false }];
    });
  };

  const updateTemplateSetting = (
    index: number,
    field: "minQuantity" | "maxQuantity" | "isRequired",
    value: number | boolean,
  ) => {
    setEditTemplateSettings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const toggleEditDish = (dishId: string) => {
    setEditDishIds((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) {
        next.delete(dishId);
      } else {
        next.add(dishId);
      }
      return next;
    });
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filteredEditDishes = allDishes.filter(
    (d) =>
      d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải chi tiết ca ăn...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs">
        {error || "Session not found"}
      </div>
    );
  }

  if (!session) return null;

  const isActive =
    session.isActive && (!session.availableTo || new Date(session.availableTo) > new Date());

  return (
    <div className="space-y-8 animate-fade-in pb-6 select-text">
      {/* Header Info */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shadow-xs shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          {isEditing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 min-w-0 text-3xl font-black text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
              placeholder="Tên ca phục vụ"
            />
          ) : (
            <h1 className="text-3xl font-black text-gray-900">{session.name}</h1>
          )}
          <span
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
              isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500",
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
          {session.isFinalized && (
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Đã chốt
            </span>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full text-base text-gray-500 italic mt-2 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] resize-none"
            placeholder="Mô tả ca phục vụ..."
          />
        ) : (
          session.description && (
            <p className="text-base text-gray-500 italic mt-1 px-1">📝 {session.description}</p>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left column: Session schedule & templates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Thời gian ca trực
              </h2>
              {!isEditing && !session.isFinalized && (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D35400]/10 hover:bg-[#D35400]/20 text-[#D35400] text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Sửa
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Mở đặt */}
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Mở đặt
                  </p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editAvailableForOrder}
                      onChange={(e) => setEditAvailableForOrder(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400]"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableForOrder)}
                    </p>
                  )}
                </div>
              </div>

              {/* Bắt đầu */}
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Thời gian bắt đầu
                  </p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editAvailableFrom}
                      onChange={(e) => setEditAvailableFrom(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400]"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableFrom)}
                    </p>
                  )}
                </div>
              </div>

              {/* Kết thúc */}
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Thời gian kết thúc
                  </p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editAvailableTo}
                      onChange={(e) => setEditAvailableTo(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400]"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableTo)}
                    </p>
                  )}
                </div>
              </div>

              {/* Hạn chốt món */}
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Hạn chốt món
                  </p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400]"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {session.finalizationDeadline
                        ? formatDate(session.finalizationDeadline)
                        : "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Templates Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <Layers className="w-4 h-4 text-[#D35400]" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Định mức khuôn mẫu
              </h2>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#D35400]"
                  placeholder="Tên khuôn mẫu"
                />

                {/* Add category button */}
                <div className="flex flex-wrap gap-1.5">
                  {categories
                    .filter((c) => !editTemplateSettings.find((s) => s.categoryId === c.id))
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => toggleTemplateSettingCategory(cat.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-[#D35400]/10 text-gray-600 hover:text-[#D35400] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                        {cat.name}
                      </button>
                    ))}
                </div>

                {/* Editable settings */}
                <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                  {editTemplateSettings.map((s, idx) => {
                    const cat = categoryMap[s.categoryId];
                    return (
                      <div
                        key={s.categoryId}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-gray-800 truncate min-w-0">
                          {cat?.name || s.categoryId.slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-400 font-bold">Min:</span>
                          <input
                            type="number"
                            min={0}
                            max={s.maxQuantity}
                            value={s.minQuantity}
                            onChange={(e) =>
                              updateTemplateSetting(idx, "minQuantity", Number(e.target.value))
                            }
                            className="w-12 text-center border border-gray-200 rounded-lg p-1 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400]"
                          />
                          <span className="text-[10px] text-gray-400 font-bold">Max:</span>
                          <input
                            type="number"
                            min={s.minQuantity}
                            value={s.maxQuantity}
                            onChange={(e) =>
                              updateTemplateSetting(idx, "maxQuantity", Number(e.target.value))
                            }
                            className="w-12 text-center border border-gray-200 rounded-lg p-1 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400]"
                          />
                          <input
                            type="checkbox"
                            checked={s.isRequired}
                            onChange={(e) =>
                              updateTemplateSetting(idx, "isRequired", e.target.checked)
                            }
                            className="w-3.5 h-3.5 accent-[#D35400]"
                          />
                          <button
                            onClick={() =>
                              setEditTemplateSettings((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[16rem] overflow-y-auto pr-1">
                {session.mealTemplates?.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3"
                  >
                    <p className="text-sm font-black text-gray-800">📋 {template.name}</p>
                    <div className="space-y-2">
                      {template.settings.map((s, i) => {
                        const cat = categories.find((c) => c.id === s.categoryId);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 text-xs bg-white rounded-xl px-3 py-2.5 border border-gray-200 shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {cat?.imgUrl ? (
                                <div className="relative w-6 h-6 rounded-md overflow-hidden border border-gray-100 shrink-0">
                                  <Image
                                    src={cat.imgUrl}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                  />
                                </div>
                              ) : (
                                <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0">
                                  📂
                                </span>
                              )}
                              <span className="font-bold text-gray-800 truncate">
                                {cat?.name || s.categoryId.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                {s.minQuantity} - {s.maxQuantity} món
                              </span>
                              {s.isRequired && (
                                <span className="text-[9px] text-red-600 font-black uppercase tracking-wider bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Dishes list */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <UtensilsCrossed className="w-4 h-4 text-[#D35400]" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Món ăn phục vụ ({isEditing ? editDishIds.size : (session.dishes?.length ?? 0)})
              </h2>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {/* Dish search */}
                <div className="relative w-full">
                  <input
                    placeholder="Tìm kiếm món ăn..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#D35400] text-sm text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5 max-h-[28rem] overflow-y-auto pr-1">
                  {filteredEditDishes.map((dish) => {
                    const selected = editDishIds.has(dish.id);
                    return (
                      <div
                        key={dish.id}
                        onClick={() => toggleEditDish(dish.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer",
                          selected
                            ? "bg-[#D35400]/5 border-[#D35400]/30 shadow-xs"
                            : "bg-white border-gray-200 hover:border-orange-200",
                        )}
                      >
                        <div className="relative w-9 h-9 shrink-0 rounded-lg bg-gray-50 overflow-hidden">
                          {dish.imgUrl ? (
                            <Image
                              src={dish.imgUrl}
                              alt={dish.name}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                              🍽️
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{dish.name}</p>
                          <span className="text-[10px] text-gray-400">
                            {dish.categoryName || "—"}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                            selected ? "bg-[#D35400] border-[#D35400]" : "border-gray-300",
                          )}
                        >
                          {selected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[35rem] overflow-y-auto pr-1">
                {session.dishes?.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-orange-200 transition-all flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50/30"
                  >
                    <div className="relative w-10 h-10 shrink-0 rounded-lg bg-gray-50 overflow-hidden">
                      {d.imgUrl ? (
                        <Image
                          src={d.imgUrl}
                          alt={d.dishName || ""}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {d.dishName || d.dishId.slice(0, 8)}
                      </p>
                      {d.priceAmount !== undefined && (
                        <span className="text-[10px] font-bold text-[#D35400] flex items-center gap-0.5">
                          {d.priceAmount}
                          <div className="relative w-3 h-3">
                            <Image
                              src="/logo_point.png"
                              alt="pts"
                              fill
                              sizes="12px"
                              className="object-contain"
                            />
                          </div>
                        </span>
                      )}
                    </div>

                    {session.isFinalized &&
                    d.preparedQuantity !== null &&
                    d.preparedQuantity !== undefined ? (
                      <span className="text-xs font-bold text-emerald-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg shrink-0">
                        Đã CB: {d.preparedQuantity}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-gray-400">CB:</span>
                        <input
                          type="number"
                          min="0"
                          value={preparedQuantities[d.dishId] ?? 0}
                          onChange={(e) => handleQuantityChange(d.dishId, e.target.value)}
                          disabled={isSubmitting}
                          className="w-16 px-2 py-1.5 text-center border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400] text-sm font-bold shadow-xs hover:border-orange-300 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Finalization Action Block (only when not editing and not finalized) */}
            {!isEditing && !session.isFinalized && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-gray-800">
                      Chốt số lượng chuẩn bị nấu
                    </p>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5 leading-relaxed">
                      Nhập số lượng thực tế. Khi chốt đơn, ca ăn sẽ được khóa và hệ thống sẽ tự động
                      tạo đề xuất đổi/hoàn tiền cho khách hàng nếu thiếu số lượng món đã đặt.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all shadow-sm shrink-0 uppercase tracking-wider active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Chốt đơn ca ăn"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5 mt-4">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 text-white text-sm font-black rounded-2xl transition-all shadow-sm uppercase tracking-wider active:scale-95"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu thay đổi
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Đóng lại
          </button>
        )}
      </div>
    </div>
  );
}
