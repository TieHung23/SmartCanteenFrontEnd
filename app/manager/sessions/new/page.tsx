"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type { CreateSessionRequest, CreateSessionTemplate } from "@/types/session.types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Search, GripVertical, X, Package, ChefHat } from "lucide-react";
import { animate, stagger } from "animejs";
import { spring } from "animejs";


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
  const [draggedDishId, setDraggedDishId] = useState<string | null>(null);
  const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);
  const [isDragOverPool, setIsDragOverPool] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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

  // Spring bounce on drop zone when item is dropped (must be declared before handleDropToSelected)
  const animateDropBounce = useCallback(() => {
    if (dropZoneRef.current) {
      const lastChild = dropZoneRef.current.querySelector(".selected-dish-item:last-child");
      if (lastChild) {
        animate(lastChild, {
          scale: [0.8, 1],
          opacity: [0, 1],
          translateX: [-30, 0],
          duration: 500,
          ease: spring({ stiffness: 250, damping: 12, mass: 0.8 }),
        });
      }
    }
  }, []);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, dishId: string) => {
    setDraggedDishId(dishId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dishId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedDishId(null);
    setIsDragOverDropZone(false);
    setIsDragOverPool(false);
  }, []);

  const handleDropToSelected = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dishId = e.dataTransfer.getData("text/plain");
    if (dishId && !selectedDishIds.has(dishId)) {
      toggleDish(dishId);
      // Trigger spring bounce after React re-renders
      setTimeout(() => animateDropBounce(), 50);
    }
    setIsDragOverDropZone(false);
    setDraggedDishId(null);
  }, [selectedDishIds, animateDropBounce]);

  const handleDropToPool = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dishId = e.dataTransfer.getData("text/plain");
    if (dishId && selectedDishIds.has(dishId)) {
      toggleDish(dishId);
    }
    setIsDragOverPool(false);
    setDraggedDishId(null);
  }, [selectedDishIds]);

  const handleDragOverDropZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverDropZone(true);
  }, []);

  const handleDragOverPool = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverPool(true);
  }, []);

  // Category-filtered available dishes (unselected only)
  const availableDishes = useMemo(() => {
    let pool = filteredDishes.filter((d) => !selectedDishIds.has(d.id));
    if (categoryFilter !== "all") {
      pool = pool.filter((d) => d.categoryId === categoryFilter);
    }
    return pool;
  }, [filteredDishes, selectedDishIds, categoryFilter]);

  // Unique categories from available dishes for filter tabs
  const dishCategories = useMemo(() => {
    const cats = new Map<string, string>();
    dishes.forEach((d) => {
      if (d.categoryId && d.categoryName) {
        cats.set(d.categoryId, d.categoryName);
      }
    });
    return Array.from(cats.entries());
  }, [dishes]);

  // Refs for anime.js animations
  const poolGridRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const prevSelectedCount = useRef(0);

  // 1. Staggered entrance animation for available dish cards
  useEffect(() => {
    if (!loading && poolGridRef.current) {
      const cards = poolGridRef.current.querySelectorAll(".dish-card-pool");
      if (cards.length > 0) {
        animate(cards, {
          opacity: [0, 1],
          translateY: [20, 0],
          scale: [0.92, 1],
          delay: stagger(40, { start: 100 }),
          duration: 500,
          ease: "outQuint",
        });
      }
    }
  }, [loading, categoryFilter, dishSearch]);

  // 2. Counter animation when selected count changes
  useEffect(() => {
    if (counterRef.current && prevSelectedCount.current !== selectedDishes.length) {
      animate(counterRef.current, {
        scale: [1.35, 1],
        duration: 400,
        ease: spring({ stiffness: 300, damping: 15, mass: 1 }),
      });
      prevSelectedCount.current = selectedDishes.length;
    }
  }, [selectedDishes.length]);

  // 4. Ripple effect handler
  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `position:absolute;border-radius:50%;background:rgba(211,84,0,0.12);pointer-events:none;width:${size}px;height:${size}px;left:${x}px;top:${y}px;z-index:20;`;
    target.style.position = "relative";
    target.style.overflow = "hidden";
    target.appendChild(ripple);
    animate(ripple, {
      scale: [0, 2.5],
      opacity: [1, 0],
      duration: 600,
      ease: "outQuint",
      onComplete: () => ripple.remove(),
    });
  }, []);

  // 5. Elastic hover animation handler
  const handleElasticHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      scale: [1, 1.04, 1],
      duration: 400,
      ease: spring({ stiffness: 400, damping: 10, mass: 0.6 }),
    });
  }, []);


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
      <div className="max-w-2xl mx-auto mt-16 bg-white rounded-3xl border border-green-100/60 p-8 text-center space-y-6 shadow-md animate-fade-in">
        <div className="w-20 h-20 bg-green-50 border border-green-200/60 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xs">
          <span className="text-4xl">✓</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Tạo phiên thành công!</h2>
          <p className="text-lg text-gray-500">
            Phiên phục vụ <span className="font-bold text-gray-900">&quot;{success.name}&quot;</span> đã được tạo lập thành công.
          </p>
          <p className="text-xs text-gray-400 font-mono">Session ID: {success.id}</p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => router.push(`/manager/sessions/${success.id}`)}
            className="px-6 py-3.5 bg-[#D35400] text-white rounded-2xl text-base font-bold hover:bg-[#b84900] transition-colors shadow-sm"
          >
            Xem chi tiết
          </button>
          <button
            onClick={() => router.push("/manager/sessions")}
            className="px-6 py-3.5 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors font-bold"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sessions
        </button>

        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {copyFrom ? "Copy Serving Session" : "New Serving Session"}
          </h1>
          <p className="text-lg text-gray-500 mt-1.5">
            {copyFrom
              ? "Sao chép cấu hình ca phục vụ có sẵn và điều chỉnh."
              : "Thiết lập thời gian, mẫu định mức suất ăn và danh sách món phục vụ."}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Basic Info & Timeline Card (Full Width) */}
      <div className="bg-white rounded-3xl border border-gray-200/60 p-6 space-y-6 shadow-2xs">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Thông tin cơ bản</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Tên ca ăn *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Buổi trưa thứ 2"'
              className="w-full px-4 py-3 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-2xs"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Ngày phục vụ *</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 transition-all cursor-pointer shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Chính sách quá hạn *</label>
            <select
              value={autoFinalizePolicy}
              onChange={(e) => setAutoFinalizePolicy(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-gray-200/60 rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all cursor-pointer shadow-2xs"
            >
              <option value={0}>Hủy đơn hàng nếu quá hạn (AutoReject)</option>
              <option value={1}>Tự động xác nhận tất cả nếu quá hạn (AutoConfirmAll)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">Mô tả chi tiết *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết về ca phục vụ..."
            rows={3}
            className="w-full px-4 py-3 text-base bg-white border border-gray-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all resize-none shadow-2xs"
          />
        </div>

        {/* Timeline Grid */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-bold text-gray-600 mb-3">Biểu đồ thời gian (Timeline)</label>
          <div className="overflow-x-auto pb-3 border border-gray-100 rounded-3xl bg-gray-50/50 p-4 shadow-3xs">
            <div className="min-w-[820px]">
              {/* Header row: time labels */}
              <div className="flex gap-1.5 mb-2">
                <div className="w-24 shrink-0" />
                {TIME_SLOTS.map((t) => (
                  <div
                    key={t}
                    className="w-12 shrink-0 text-center text-xs font-bold text-gray-400 font-mono"
                  >
                    {t}
                  </div>
                ))}
              </div>

              {/* Row: Mở đặt */}
              <div className="flex gap-1.5 items-center mb-2">
                <div className="w-24 shrink-0 text-xs font-bold text-gray-600 tracking-wide">
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
                        "w-12 h-9 shrink-0 rounded-xl text-xs font-bold transition-all border",
                        isSelected
                          ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200/80 hover:border-[#D35400] hover:text-[#D35400]",
                        !sessionDate && "opacity-30 cursor-not-allowed",
                      )}
                    >
                      {isSelected ? "●" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Row: Bắt đầu */}
              <div className="flex gap-1.5 items-center mb-2">
                <div className="w-24 shrink-0 text-xs font-bold text-gray-600 tracking-wide">
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
                        "w-12 h-9 shrink-0 rounded-xl text-xs font-bold transition-all border",
                        isSelected
                          ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                          : isDisabled
                            ? "bg-gray-150 text-gray-300 border-gray-200/60 cursor-not-allowed"
                            : "bg-white text-gray-600 border-gray-200/80 hover:border-[#D35400] hover:text-[#D35400]",
                      )}
                    >
                      {isSelected ? "●" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Row: Kết thúc */}
              <div className="flex gap-1.5 items-center">
                <div className="w-24 shrink-0 text-xs font-bold text-gray-600 tracking-wide">
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
                        "w-12 h-9 shrink-0 rounded-xl text-xs font-bold transition-all border",
                        isSelected
                          ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                          : isDisabled
                            ? "bg-gray-150 text-gray-300 border-gray-200/60 cursor-not-allowed"
                            : "bg-white text-gray-600 border-gray-200/80 hover:border-[#D35400] hover:text-[#D35400]",
                      )}
                    >
                      {isSelected ? "●" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Row: Hạn chốt */}
              <div className="flex gap-1.5 items-center mt-3 pt-3 border-t border-dashed border-gray-200">
                <div className="w-24 shrink-0 text-xs font-bold text-gray-400 tracking-wide">
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
                        "w-12 h-9 shrink-0 rounded-xl text-xs font-bold transition-all border",
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : isDisabled
                            ? "bg-gray-150 text-gray-300 border-gray-200/60 cursor-not-allowed"
                            : "bg-white text-gray-400 border-gray-200/80 hover:border-amber-400 hover:text-amber-500",
                      )}
                    >
                      {isSelected ? "●" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Columns grid for Templates and Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Templates (2/5) */}
        <div className="lg:col-span-2">
          {/* Meal Templates Form */}
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-150 pb-2">
              <h3 className="text-lg font-bold text-gray-900">Khuôn mẫu suất ăn</h3>
              <button
                type="button"
                onClick={addTemplate}
                className="px-4 py-2 border border-gray-200/60 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                + Thêm mẫu
              </button>
            </div>
            
            {templates.length === 0 && (
              <p className="text-sm text-gray-400 italic py-2">Chưa thiết lập khuôn mẫu suất ăn nào.</p>
            )}

            <div className="space-y-4">
              {templates.map((template, tIdx) => (
                <div key={tIdx} className="border border-gray-200/60 rounded-3xl p-4 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base">📋</span>
                    <input
                      placeholder="Tên khuôn mẫu..."
                      value={template.name}
                      onChange={(e) => updateTemplateName(tIdx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
                    />
                    <button
                      type="button"
                      onClick={() => removeTemplate(tIdx)}
                      className="text-red-500 hover:text-red-650 text-xs font-bold"
                    >
                      Xóa mẫu
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {template.settings.map((setting, sIdx) => {
                      const cat = categoryMap[setting.categoryId];
                      return (
                        <div
                          key={sIdx}
                          className="flex flex-wrap items-center gap-3 bg-white border border-gray-150/60 rounded-2xl p-3 shadow-3xs"
                        >
                          <span className="text-sm font-bold text-gray-800 flex-1 min-w-[100px] truncate">
                            {cat?.name || "—"}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">Min:</span>
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
                              className="w-12 h-8 border border-gray-200/60 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">Max:</span>
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
                              className="w-12 h-8 border border-gray-200/60 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#D35400]/20"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={setting.isRequired}
                              onChange={(e) =>
                                updateTemplateSetting(tIdx, sIdx, "isRequired", e.target.checked)
                              }
                              className="accent-[#D35400] w-4 h-4 rounded"
                            />
                            Bắt buộc
                          </label>

                          <button
                            type="button"
                            onClick={() => removeTemplateSetting(tIdx, sIdx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {availableCategories.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {availableCategories
                        .filter((c) => !template.settings.some((s) => s.categoryId === c.id))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => addTemplateSetting(tIdx, cat.id)}
                            className="px-3 py-1.5 bg-white border border-gray-200/60 hover:border-[#D35400] hover:text-[#D35400] rounded-2xl text-xs font-bold transition-all shadow-3xs"
                          >
                            + {cat.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Drag & Drop Dish Selector */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-200/60 p-6 space-y-5 shadow-2xs">
            {/* Header with counter */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D35400]/10 to-orange-100 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-[#D35400]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Chọn món ăn phục vụ
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Kéo thả hoặc nhấn để chọn món</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span ref={counterRef} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D35400]/5 border border-[#D35400]/15 rounded-2xl text-sm font-bold text-[#D35400]">
                  <Package className="w-4 h-4" />
                  {selectedDishes.length} đã chọn
                </span>
              </div>
            </div>

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" style={{ minHeight: 520 }}>

              {/* LEFT PANEL: Available dishes pool */}
              <div
                className="flex flex-col"
                onDrop={handleDropToPool}
                onDragOver={handleDragOverPool}
                onDragLeave={() => setIsDragOverPool(false)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-bold text-gray-600 tracking-wide">Danh sách món ăn</span>
                  <span className="text-xs text-gray-400 ml-auto">{availableDishes.length} món</span>
                </div>

                {/* Search bar */}
                <div className="relative w-full mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    placeholder="Tìm kiếm món ăn..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#D35400]/15 focus:border-[#D35400]/40 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                {/* Category filter tabs */}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      categoryFilter === "all"
                        ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                        : "bg-white text-gray-500 border-gray-200/60 hover:border-[#D35400]/30 hover:text-[#D35400]"
                    )}
                  >
                    Tất cả
                  </button>
                  {dishCategories.map(([catId, catName]) => (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setCategoryFilter(catId)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        categoryFilter === catId
                          ? "bg-[#D35400] text-white border-[#D35400] shadow-sm"
                          : "bg-white text-gray-500 border-gray-200/60 hover:border-[#D35400]/30 hover:text-[#D35400]"
                      )}
                    >
                      {catName}
                    </button>
                  ))}
                </div>

                {/* Dishes grid (scrollable) */}
                <div
                  className={cn(
                    "flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                    isDragOverPool
                      ? "border-blue-400 bg-blue-50/30 drop-zone-active"
                      : "border-gray-200/60 bg-gray-50/30"
                  )}
                >
                  <div ref={poolGridRef} className="grid grid-cols-2 gap-3 p-3 max-h-[480px] overflow-y-auto scrollbar-thin">
                    {availableDishes.map((dish) => (
                      <div
                        key={dish.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dish.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { createRipple(e); toggleDish(dish.id); }}
                        onMouseEnter={handleElasticHover}
                        className={cn(
                          "dish-card-pool drag-item card-3d bg-white rounded-2xl border border-gray-200/60 overflow-hidden flex flex-col shadow-3xs hover:shadow-md",
                          draggedDishId === dish.id && "dragging"
                        )}
                      >
                        <div className="relative w-full aspect-[16/10] bg-gray-50 border-b border-gray-100 shrink-0">
                          {dish.imgUrl ? (
                            <Image
                              src={dish.imgUrl}
                              alt={dish.name}
                              fill
                              className="object-cover pointer-events-none"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 opacity-60">
                            <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                          <p className="text-sm font-bold text-gray-800 truncate">{dish.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 border border-gray-200/50 rounded-lg truncate max-w-[80px]">
                              {dish.categoryName || "—"}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#D35400]">
                              {dish.price}
                              <div className="relative w-4 h-4 opacity-95">
                                <Image
                                  src="/logo_point.png"
                                  alt="Point"
                                  fill
                                  sizes="16px"
                                  className="object-contain"
                                />
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {availableDishes.length === 0 && (
                      <div className="col-span-full py-12 text-center text-sm font-bold text-gray-400">
                        {dishSearch ? "Không tìm thấy món ăn nào khớp." : "Tất cả đã được chọn!"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Selected dishes drop zone */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#D35400]" />
                  <span className="text-sm font-bold text-[#D35400] tracking-wide">Món đã chọn</span>
                  <span className="text-xs text-[#D35400]/60 ml-auto">{selectedDishes.length} món</span>
                </div>

                <div
                  onDrop={handleDropToSelected}
                  onDragOver={handleDragOverDropZone}
                  onDragLeave={() => setIsDragOverDropZone(false)}
                  className={cn(
                    "flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden",
                    isDragOverDropZone
                      ? "border-[#D35400] bg-[#D35400]/5 drop-zone-active"
                      : selectedDishes.length > 0
                        ? "border-[#D35400]/30 bg-[#D35400]/[0.02]"
                        : "border-gray-300/60 bg-gray-50/40"
                  )}
                >
                  {/* Shimmer overlay when dragging */}
                  {draggedDishId && !selectedDishIds.has(draggedDishId) && (
                    <div className="absolute inset-0 drop-zone-shimmer pointer-events-none z-10" />
                  )}

                  {selectedDishes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[420px] gap-4">
                      <div className={cn(
                        "w-20 h-20 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all duration-300",
                        isDragOverDropZone
                          ? "border-[#D35400] bg-[#D35400]/10 scale-110"
                          : "border-gray-300 bg-gray-50"
                      )}>
                        <Package className={cn(
                          "w-8 h-8 transition-colors",
                          isDragOverDropZone ? "text-[#D35400]" : "text-gray-300"
                        )} />
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          "text-sm font-bold transition-colors",
                          isDragOverDropZone ? "text-[#D35400]" : "text-gray-400"
                        )}>
                          {isDragOverDropZone ? "Thả vào đây!" : "Kéo thả món ăn vào đây"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          hoặc nhấn vào món ăn bên trái
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div ref={dropZoneRef} className="flex flex-col gap-2 p-3 max-h-[480px] overflow-y-auto scrollbar-thin">
                      {selectedDishes.map((dish) => (
                        <div
                          key={dish.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, dish.id)}
                          onDragEnd={handleDragEnd}
                          onMouseEnter={handleElasticHover}
                          className={cn(
                            "selected-dish-item drag-item dish-pop-in flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#D35400]/15 shadow-3xs hover:shadow-sm hover:border-[#D35400]/30 group transition-all",
                            draggedDishId === dish.id && "dragging"
                          )}
                        >
                          <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-[#D35400]/50 shrink-0 transition-colors" />
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/50">
                            {dish.imgUrl ? (
                              <Image
                                src={dish.imgUrl}
                                alt={dish.name}
                                fill
                                className="object-cover pointer-events-none"
                                sizes="44px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                🍽️
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{dish.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-gray-400 truncate">
                                {dish.categoryName || "—"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#D35400]">
                                {dish.price}
                                <div className="relative w-3.5 h-3.5 opacity-90">
                                  <Image
                                    src="/logo_point.png"
                                    alt="Point"
                                    fill
                                    sizes="14px"
                                    className="object-contain"
                                  />
                                </div>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleDish(dish.id); }}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
        <button
          onClick={() => router.push("/manager/sessions")}
          className="px-6 py-3.5 border border-gray-200 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3.5 bg-[#D35400] text-white rounded-2xl text-base font-bold hover:bg-[#b84900] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Đang xử lý..." : copyFrom ? "Sao chép phiên" : "Tạo phiên"}
        </button>
      </div>
    </div>
  );
}

