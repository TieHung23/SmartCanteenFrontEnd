"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type { CreateSessionRequest, CreateSessionTemplate } from "@/types/session.types";
import { cn } from "@/lib/utils";

export default function NewSessionPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      }
    >
      <NewSessionPage />
    </Suspense>
  );
}

function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFrom = searchParams.get("copyFrom");

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [availableForOrder, setAvailableForOrder] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [finalizationDeadline, setFinalizationDeadline] = useState("");
  const [autoFinalizePolicy, setAutoFinalizePolicy] = useState(0);

  const [dishSearch, setDishSearch] = useState("");
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<CreateSessionTemplate[]>([
    {
      name: "Suất chuẩn",
      settings: [],
    },
  ]);

  const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
    const h = Math.floor(i * 0.5);
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  });

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dishResult, catResult] = await Promise.all([
          dishService.getDishes({ isActive: true, pageSize: 100 }),
          categoryService.getAll(),
        ]);
        setDishes(dishResult.items);
        setCategories(catResult.items);

        if (copyFrom) {
          const detail = await sessionService.getSessionDetail(copyFrom);
          setName(detail.name);
          setDescription(detail.description);
          setAvailableFrom(toDatetimeLocal(detail.availableFrom));
          setAvailableTo(toDatetimeLocal(detail.availableTo));
          setAvailableForOrder(toDatetimeLocal(detail.availableForOrder));
          setSessionDate(toDatetimeLocal(detail.availableFrom).split("T")[0]);
          setSelectedDishIds(new Set(detail.dishes.map((d) => d.dishId)));
          setTemplates(
            detail.mealTemplates.map((t) => ({
              name: t.name,
              settings: t.settings,
            })),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [copyFrom]);

  const filteredDishes = useMemo(
    () =>
      dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
          d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase()),
      ),
    [dishes, dishSearch],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  const selectedDishes = useMemo(
    () => dishes.filter((d) => selectedDishIds.has(d.id)),
    [dishes, selectedDishIds],
  );

  const selectedCategoryIds = useMemo(
    () => new Set(selectedDishes.map((d) => d.categoryId).filter(Boolean) as string[]),
    [selectedDishes],
  );

  const availableCategories = useMemo(
    () => categories.filter((c) => selectedCategoryIds.has(c.id)),
    [categories, selectedCategoryIds],
  );

  const toggleDish = (dishId: string) => {
    setSelectedDishIds((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) {
        next.delete(dishId);
      } else {
        next.add(dishId);
      }
      return next;
    });
  };

  const addTemplate = () => {
    setTemplates((prev) => [
      ...prev,
      {
        name: "",
        settings: [],
      },
    ]);
  };

  const removeTemplate = (idx: number) => {
    setTemplates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTemplateName = (idx: number, val: string) => {
    setTemplates((prev) => prev.map((t, i) => (i === idx ? { ...t, name: val } : t)));
  };

  const updateTemplateSetting = (
    tIdx: number,
    sIdx: number,
    field: "minQuantity" | "maxQuantity" | "isRequired",
    value: number | boolean,
  ) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? {
              ...t,
              settings: t.settings.map((s, j) => (j === sIdx ? { ...s, [field]: value } : s)),
            }
          : t,
      ),
    );
  };

  const addTemplateSetting = (tIdx: number, categoryId: string) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? {
              ...t,
              settings: [
                ...t.settings,
                { categoryId, minQuantity: 0, maxQuantity: 1, isRequired: false },
              ],
            }
          : t,
      ),
    );
  };

  const removeTemplateSetting = (tIdx: number, sIdx: number) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx ? { ...t, settings: t.settings.filter((_, j) => j !== sIdx) } : t,
      ),
    );
  };

  // Auto-sync template settings with selected categories
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates((prev) =>
      prev.map((t) => {
        const updatedSettings = t.settings.filter((s) => selectedCategoryIds.has(s.categoryId));
        for (const catId of selectedCategoryIds) {
          if (!updatedSettings.some((s) => s.categoryId === catId)) {
            updatedSettings.push({
              categoryId: catId,
              minQuantity: 0,
              maxQuantity: 1,
              isRequired: false,
            });
          }
        }
        return { ...t, settings: updatedSettings };
      }),
    );
  }, [selectedCategoryIds]);

  const validate = (): string | null => {
    if (!name.trim()) return "Session name is required.";
    if (!description.trim()) return "Description is required.";
    if (!availableFrom) return "Start time is required.";
    if (!availableTo) return "End time is required.";
    if (!availableForOrder) return "Order open time is required.";
    if (new Date(availableFrom) >= new Date(availableTo))
      return "Start time must be before end time.";
    if (new Date(availableForOrder) >= new Date(availableFrom))
      return "Order open time must be before session start.";
    if (finalizationDeadline && new Date(finalizationDeadline) <= new Date())
      return "Finalization deadline must be in the future.";
    if (selectedDishIds.size === 0) return "Select at least one dish.";
    if (templates.some((t) => !t.name.trim())) return "All meal templates need a name.";
    for (const t of templates) {
      for (const s of t.settings) {
        if (s.maxQuantity < s.minQuantity) return "Max quantity must be >= min quantity.";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CreateSessionRequest = {
      name: name.trim(),
      description: description.trim(),
      availableFrom: new Date(availableFrom).toISOString(),
      availableTo: new Date(availableTo).toISOString(),
      availableForOrder: new Date(availableForOrder).toISOString(),
      ...(finalizationDeadline
        ? { finalizationDeadline: new Date(finalizationDeadline).toISOString() }
        : {}),
      autoFinalizePolicy,
      dishes: Array.from(selectedDishIds).map((dishId) => ({ dishId })),
      mealTemplates: templates
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          settings: t.settings,
        })),
    };

    try {
      const result = await sessionService.createSession(payload);
      setSuccess({ id: result.value.id, name: result.value.name });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create session";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Loading...</span>
        {copyFrom && <span className="ml-1 text-sm text-gray-400">(Copying session...)</span>}
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Tạo phiên thành công!</h2>
        <p className="text-gray-500">
          <span className="font-semibold text-gray-700">{success.name}</span> has been created
          successfully.
        </p>
        <p className="text-xs text-gray-400 font-mono">ID: {success.id.slice(0, 8)}...</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => router.push(`/manager/sessions/${success.id}`)}
            className="px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors"
          >
            Xem chi tiết
          </button>
          <button
            onClick={() => router.push("/manager/sessions")}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {copyFrom ? "Sao chép phiên ăn" : "Tạo phiên ăn mới"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {copyFrom
            ? "Copy an existing session and adjust before creating"
            : "Create a new meal serving session"}
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Form + Templates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên phiên *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "Buổi trưa thứ 2"'
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of the session"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] resize-none"
                />
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
                />
              </div>

              {/* Timeline: unified time slot selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[600px]">
                    {/* Header row: time labels */}
                    <div className="flex gap-1 mb-1">
                      <div className="w-20 shrink-0" />
                      {TIME_SLOTS.map((t) => (
                        <div
                          key={t}
                          className="w-10 shrink-0 text-center text-[10px] font-medium text-gray-400"
                        >
                          {t}
                        </div>
                      ))}
                    </div>

                    {/* Row: Mở đặt */}
                    <div className="flex gap-1 items-center mb-1">
                      <div className="w-20 shrink-0 text-xs font-medium text-gray-600">
                        Mở đặt *
                      </div>
                      {TIME_SLOTS.map((t) => {
                        const full = sessionDate ? `${sessionDate}T${t}` : "";
                        const isSelected = availableForOrder === full;
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!sessionDate}
                            onClick={() => setAvailableForOrder(full)}
                            className={cn(
                              "w-10 h-8 shrink-0 rounded text-[10px] font-semibold transition-all border",
                              isSelected
                                ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-[#D35400] hover:text-[#D35400]",
                              !sessionDate && "opacity-30 cursor-not-allowed",
                            )}
                          >
                            {isSelected ? "●" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {/* Row: Bắt đầu */}
                    <div className="flex gap-1 items-center mb-1">
                      <div className="w-20 shrink-0 text-xs font-medium text-gray-600">
                        Bắt đầu *
                      </div>
                      {TIME_SLOTS.map((t) => {
                        const full = sessionDate ? `${sessionDate}T${t}` : "";
                        const isSelected = availableFrom === full;
                        const orderTime = availableForOrder.split("T")[1];
                        const isDisabled =
                          !sessionDate || (orderTime !== undefined && t <= orderTime);
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setAvailableFrom(full)}
                            className={cn(
                              "w-10 h-8 shrink-0 rounded text-[10px] font-semibold transition-all border",
                              isSelected
                                ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                                : isDisabled
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-[#D35400] hover:text-[#D35400]",
                            )}
                          >
                            {isSelected ? "●" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {/* Row: Kết thúc */}
                    <div className="flex gap-1 items-center">
                      <div className="w-20 shrink-0 text-xs font-medium text-gray-600">
                        Kết thúc *
                      </div>
                      {TIME_SLOTS.map((t) => {
                        const full = sessionDate ? `${sessionDate}T${t}` : "";
                        const isSelected = availableTo === full;
                        const startTime = availableFrom.split("T")[1];
                        const deadlineTime = finalizationDeadline.split("T")[1];
                        const isDisabled =
                          !sessionDate ||
                          (startTime !== undefined && t <= startTime) ||
                          (deadlineTime !== undefined && t <= deadlineTime);
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setAvailableTo(full)}
                            className={cn(
                              "w-10 h-8 shrink-0 rounded text-[10px] font-semibold transition-all border",
                              isSelected
                                ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                                : isDisabled
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-[#D35400] hover:text-[#D35400]",
                            )}
                          >
                            {isSelected ? "●" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {/* Row: Hạn chốt (optional) */}
                    <div className="flex gap-1 items-center mt-2 pt-2 border-t border-dashed border-gray-200">
                      <div className="w-20 shrink-0 text-xs font-medium text-gray-400">
                        Hạn chốt
                      </div>
                      {TIME_SLOTS.map((t) => {
                        const full = sessionDate ? `${sessionDate}T${t}` : "";
                        const isSelected = finalizationDeadline === full;
                        const startTime = availableFrom.split("T")[1];
                        const endTime = availableTo.split("T")[1];
                        const isDisabled =
                          !sessionDate ||
                          (startTime !== undefined && t < startTime) ||
                          (endTime !== undefined && t >= endTime);
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setFinalizationDeadline(isSelected ? "" : full)}
                            className={cn(
                              "w-10 h-8 shrink-0 rounded text-[10px] font-semibold transition-all border",
                              isSelected
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : isDisabled
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-400 border-gray-200 hover:border-amber-400 hover:text-amber-500",
                            )}
                          >
                            {isSelected ? "●" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">⚙️</span>
                  <select
                    value={autoFinalizePolicy}
                    onChange={(e) => setAutoFinalizePolicy(Number(e.target.value))}
                    className="h-8 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 bg-white"
                  >
                    <option value={0}>Hủy đơn (AutoReject)</option>
                    <option value={1}>Xác nhận tất cả (AutoConfirmAll)</option>
                  </select>
                  <span className="text-xs text-gray-400">nếu quá hạn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Meal Templates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Mẫu suất ăn</h3>
              <button
                onClick={addTemplate}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                + Thêm mẫu
              </button>
            </div>
            {templates.length === 0 && <p className="text-sm text-gray-400">Chưa có mẫu nào.</p>}
            <div className="space-y-3">
              {templates.map((template, tIdx) => (
                <div key={tIdx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm mr-2">📋</span>
                    <input
                      placeholder="Tên mẫu..."
                      value={template.name}
                      onChange={(e) => updateTemplateName(tIdx, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                    />
                    <button
                      onClick={() => removeTemplate(tIdx)}
                      className="ml-3 text-red-400 hover:text-red-500 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    {template.settings.map((setting, sIdx) => {
                      const cat = categoryMap[setting.categoryId];
                      return (
                        <div
                          key={sIdx}
                          className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                            {cat?.name || "—"}
                          </span>
                          <label className="text-xs text-gray-500">Min:</label>
                          <input
                            type="number"
                            min={0}
                            value={setting.minQuantity}
                            onChange={(e) =>
                              updateTemplateSetting(
                                tIdx,
                                sIdx,
                                "minQuantity",
                                Number(e.target.value),
                              )
                            }
                            className="w-16 h-7 px-2 rounded border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                          />
                          <label className="text-xs text-gray-500">Max:</label>
                          <input
                            type="number"
                            min={0}
                            value={setting.maxQuantity}
                            onChange={(e) =>
                              updateTemplateSetting(
                                tIdx,
                                sIdx,
                                "maxQuantity",
                                Number(e.target.value),
                              )
                            }
                            className="w-16 h-7 px-2 rounded border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={setting.isRequired}
                              onChange={(e) =>
                                updateTemplateSetting(tIdx, sIdx, "isRequired", e.target.checked)
                              }
                              className="accent-[#D35400] w-3.5 h-3.5"
                            />
                            Bắt buộc
                          </label>
                          <button
                            onClick={() => removeTemplateSetting(tIdx, sIdx)}
                            className="ml-auto text-red-400 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {availableCategories.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {availableCategories
                        .filter((c) => !template.settings.some((s) => s.categoryId === c.id))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => addTemplateSetting(tIdx, cat.id)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                          >
                            + {cat.name}
                          </button>
                        ))}
                    </div>
                  )}
                  {availableCategories.filter(
                    (c) => !template.settings.some((s) => s.categoryId === c.id),
                  ).length === 0 && <p className="text-xs text-gray-400">All categories added.</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Dish selector */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                Chọn món ({selectedDishes.length} selected)
              </h2>
            </div>
            <input
              placeholder="🔍 Tìm món..."
              value={dishSearch}
              onChange={(e) => setDishSearch(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
              {filteredDishes.map((dish) => {
                const isSelected = selectedDishIds.has(dish.id);
                return (
                  <div
                    key={dish.id}
                    onClick={() => toggleDish(dish.id)}
                    className={cn(
                      "bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md",
                      isSelected
                        ? "border-[#D35400] ring-1 ring-[#D35400]/30"
                        : "border-gray-100 hover:border-orange-200",
                    )}
                  >
                    <div className="relative w-full aspect-[4/3] bg-gray-100">
                      {dish.imgUrl ? (
                        <Image
                          src={dish.imgUrl}
                          alt={dish.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[#D35400] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{dish.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{dish.categoryName || "—"}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {dish.price} Point
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredDishes.length === 0 && (
                <div className="col-span-full px-4 py-8 text-center text-sm text-gray-400">
                  No dishes found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push("/manager/sessions")}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "px-6 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm",
            submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-[#b84900]",
          )}
        >
          {submitting ? "Đang tạo..." : "Tạo phiên"}
        </button>
      </div>
    </div>
  );
}
