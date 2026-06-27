"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type { CreateSessionRequest, CreateSessionTemplate } from "@/types/session.types";
import { cn } from "@/lib/utils";
import {
  Search,
  GripVertical,
  X,
  Package,
  ChefHat,
  CalendarPlus,
  Play,
  Hourglass,
  Lock,
} from "lucide-react";
import { animate, stagger } from "animejs";
import { spring } from "animejs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import dayjs from "dayjs";
import { toast } from "sonner";

interface NewSessionFormProps {
  copyFromId: string | null;
  onSuccess: (session: { id: string; name: string }) => void;
  onCancel: () => void;
}

export function NewSessionForm({ copyFromId: copyFrom, onSuccess, onCancel }: NewSessionFormProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [availableForOrder, setAvailableForOrder] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [finalizationDeadline, setFinalizationDeadline] = useState("");
  const [autoFinalizePolicy, setAutoFinalizePolicy] = useState(0);
  const [activePicker, setActivePicker] = useState<"order" | "start" | "end" | "deadline" | null>(
    null,
  );
  const [tempTime, setTempTime] = useState<dayjs.Dayjs | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const getDisplayTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return "__:__";
    const parts = dateTimeStr.split("T");
    return parts[1] || "__:__";
  };

  const handleTimeChange = (
    type: "order" | "start" | "end" | "deadline",
    time: dayjs.Dayjs | null,
  ) => {
    if (!time) {
      if (type === "order") setAvailableForOrder("");
      else if (type === "start") setAvailableFrom("");
      else if (type === "end") setAvailableTo("");
      else if (type === "deadline") setFinalizationDeadline("");
      return;
    }
    const dateStr = sessionDate || dayjs().format("YYYY-MM-DD");
    if (!sessionDate) {
      setSessionDate(dateStr);
    }
    const timeStr = time.format("HH:mm");
    const fullStr = `${dateStr}T${timeStr}`;

    if (type === "order") setAvailableForOrder(fullStr);
    else if (type === "start") setAvailableFrom(fullStr);
    else if (type === "end") setAvailableTo(fullStr);
    else if (type === "deadline") setFinalizationDeadline(fullStr);

    setErrors((prev) => {
      const next = { ...prev };
      if (type === "order") {
        delete next.availableForOrder;
      } else if (type === "start") {
        delete next.availableFrom;
        delete next.availableTo;
      } else if (type === "end") {
        delete next.availableTo;
      } else if (type === "deadline") {
        delete next.finalizationDeadline;
      }
      return next;
    });
  };

  const openPicker = (type: "order" | "start" | "end" | "deadline") => {
    if (!sessionDate) {
      alert("Vui lòng chọn Ngày phục vụ trước!");
      return;
    }
    const currentVal =
      type === "order"
        ? availableForOrder
        : type === "start"
          ? availableFrom
          : type === "end"
            ? availableTo
            : finalizationDeadline;
    if (currentVal) {
      setTempTime(dayjs(currentVal));
    } else {
      let defaultHour = "12:00";
      if (type === "order") defaultHour = "07:00";
      else if (type === "start") defaultHour = "11:00";
      else if (type === "deadline") defaultHour = "11:30";
      else if (type === "end") defaultHour = "13:30";
      setTempTime(dayjs(`${sessionDate}T${defaultHour}`));
    }
    setActivePicker(type);
  };

  const handleConfirm = () => {
    if (activePicker && tempTime) {
      handleTimeChange(activePicker, tempTime);
    }
    setActivePicker(null);
  };

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

  const toggleDish = useCallback(
    (dishId: string) => {
      setSelectedDishIds((prev) => {
        const next = new Set(prev);
        if (next.has(dishId)) {
          next.delete(dishId);
        } else {
          next.add(dishId);
        }
        return next;
      });
      if (errors.dishes) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.dishes;
          return next;
        });
      }
    },
    [errors.dishes],
  );

  const poolGridRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const prevSelectedCount = useRef(0);

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

  const handleDropToSelected = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dishId = e.dataTransfer.getData("text/plain");
      if (dishId && !selectedDishIds.has(dishId)) {
        toggleDish(dishId);
        setTimeout(() => animateDropBounce(), 50);
      }
      setIsDragOverDropZone(false);
      setDraggedDishId(null);
    },
    [selectedDishIds, animateDropBounce, toggleDish],
  );

  const handleDropToPool = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dishId = e.dataTransfer.getData("text/plain");
      if (dishId && selectedDishIds.has(dishId)) {
        toggleDish(dishId);
      }
      setIsDragOverPool(false);
      setDraggedDishId(null);
    },
    [selectedDishIds, toggleDish],
  );

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

  const availableDishes = useMemo(() => {
    let pool = filteredDishes.filter((d) => !selectedDishIds.has(d.id));
    if (categoryFilter !== "all") {
      pool = pool.filter((d) => d.categoryId === categoryFilter);
    }
    return pool;
  }, [filteredDishes, selectedDishIds, categoryFilter]);

  const dishCategories = useMemo(() => {
    const cats = new Map<string, string>();
    dishes.forEach((d) => {
      if (d.categoryId && d.categoryName) {
        cats.set(d.categoryId, d.categoryName);
      }
    });
    return Array.from(cats.entries());
  }, [dishes]);

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
    if (errors.templatesName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.templatesName;
        return next;
      });
    }
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
    if (errors.templatesSettings) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.templatesSettings;
        return next;
      });
    }
  };

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

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên ca phục vụ là bắt buộc.";
    if (!description.trim()) errs.description = "Mô tả ngắn gọn là bắt buộc.";
    if (!sessionDate) errs.sessionDate = "Ngày phục vụ là bắt buộc.";
    else if (dayjs(sessionDate).isBefore(dayjs().startOf("day")))
      errs.sessionDate = "Ngày phục vụ không được ở trong quá khứ.";

    if (!availableFrom) errs.availableFrom = "Thời gian bắt đầu ca là bắt buộc.";
    if (!availableTo) errs.availableTo = "Thời gian kết thúc ca là bắt buộc.";
    if (!availableForOrder) errs.availableForOrder = "Hạn chốt order là bắt buộc.";

    if (availableForOrder && dayjs(availableForOrder).isBefore(dayjs().startOf("day")))
      errs.availableForOrder = "Thời gian mở đặt không được ở trong quá khứ.";
    if (availableFrom && availableTo && new Date(availableFrom) >= new Date(availableTo))
      errs.availableTo = "Thời gian kết thúc phải sau thời gian bắt đầu ca.";
    if (availableForOrder && availableTo && new Date(availableForOrder) >= new Date(availableTo))
      errs.availableForOrder = "Thời gian mở đặt phải trước thời gian kết thúc ca.";
    if (
      availableForOrder &&
      availableFrom &&
      new Date(availableForOrder) >= new Date(availableFrom)
    )
      errs.availableForOrder = "Thời gian mở đặt phải trước thời gian bắt đầu ca.";
    if (finalizationDeadline && new Date(finalizationDeadline) <= new Date())
      errs.finalizationDeadline = "Hạn bếp chuẩn bị xong phải ở tương lai.";

    if (selectedDishIds.size === 0) errs.dishes = "Vui lòng chọn ít nhất một món ăn.";
    if (templates.some((t) => !t.name.trim()))
      errs.templatesName = "Tên khuôn mẫu không được để trống.";
    for (const t of templates) {
      for (const s of t.settings) {
        if (s.maxQuantity < s.minQuantity) {
          errs.templatesSettings = "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu.";
        }
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setErrors({});

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
      toast.success(`Tạo ca phục vụ "${result.value.name}" thành công!`);
      onSuccess({ id: result.value.id, name: result.value.name });
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
        <span className="ml-3 text-sm text-gray-500">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 select-text">
      {error && (
        <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-sm font-bold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details & Templates */}
        <div className="lg:col-span-7 space-y-8">
          {/* General Metadata */}
          <div className="bg-white rounded-3xl border border-gray-200/35 p-6 sm:p-8 space-y-6 shadow-3xs">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-[#D35400]" />
              Thiết lập chung
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                  Tên ca phục vụ *
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Suất trưa ngày 24/06/2026"
                  className={cn(
                    "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all shadow-3xs text-sm",
                    errors.name
                      ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 text-gray-900"
                      : "border-gray-200/35 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400",
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 ml-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                  Mô tả ngắn gọn *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Suất ăn chính trưa thứ 4 bao gồm các món đạm và rau xanh"
                  rows={2}
                  className={cn(
                    "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all resize-none shadow-3xs text-sm",
                    errors.description
                      ? "border-red-500 focus:ring-red-500/20 focus:border-red-500 text-gray-900"
                      : "border-gray-200/35 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400",
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 ml-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Serves Schedule date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    Ngày phục vụ (Mặc định: Hôm nay)
                  </label>
                  <input
                    type="date"
                    min={dayjs().format("YYYY-MM-DD")}
                    value={sessionDate}
                    onChange={(e) => {
                      const newD = e.target.value;
                      setSessionDate(newD);
                      if (errors.sessionDate) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.sessionDate;
                          return next;
                        });
                      }
                      if (availableFrom)
                        setAvailableFrom(`${newD}T${availableFrom.split("T")[1] || "11:00"}`);
                      if (availableTo)
                        setAvailableTo(`${newD}T${availableTo.split("T")[1] || "13:30"}`);
                      if (availableForOrder)
                        setAvailableForOrder(
                          `${newD}T${availableForOrder.split("T")[1] || "07:00"}`,
                        );
                      if (finalizationDeadline)
                        setFinalizationDeadline(
                          `${newD}T${finalizationDeadline.split("T")[1] || "11:30"}`,
                        );
                    }}
                    className={cn(
                      "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all shadow-3xs text-sm cursor-pointer",
                      errors.sessionDate
                        ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                        : "border-gray-200/35 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900",
                    )}
                  />
                  {errors.sessionDate && (
                    <p className="text-red-500 text-xs font-semibold mt-1.5 ml-1">
                      {errors.sessionDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    Chính sách tự động chốt
                  </label>
                  <select
                    value={autoFinalizePolicy}
                    onChange={(e) => setAutoFinalizePolicy(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-200/35 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-3xs cursor-pointer"
                  >
                    <option value={0}>Không tự động chốt</option>
                    <option value={1}>Tự động chốt khi hết hạn order</option>
                    <option value={2}>Tự động chốt khi hết ca ăn</option>
                  </select>
                </div>
              </div>

              {/* MUI Pickers Trigger Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div
                  onClick={() => openPicker("order")}
                  className={cn(
                    "bg-gray-50 border rounded-2xl p-3 px-4 text-center cursor-pointer transition-all hover:bg-orange-50/20 shadow-3xs flex flex-col justify-between items-center min-h-[90px]",
                    activePicker === "order"
                      ? "border-[#D35400] bg-orange-50/10 ring-2 ring-[#D35400]/10"
                      : errors.availableForOrder
                        ? "border-red-500 bg-red-50/5 hover:bg-red-50/10"
                        : "border-gray-200/30 hover:border-[#D35400]/30",
                  )}
                >
                  <Play
                    className={cn(
                      "w-4 h-4 mx-auto mb-1.5 shrink-0",
                      errors.availableForOrder ? "text-red-500" : "text-[#D35400]",
                    )}
                  />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Mở đặt
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold mt-1",
                      errors.availableForOrder ? "text-red-600" : "text-gray-800",
                    )}
                  >
                    {getDisplayTime(availableForOrder)}
                  </p>
                </div>

                <div
                  onClick={() => openPicker("start")}
                  className={cn(
                    "bg-gray-50 border rounded-2xl p-3 px-4 text-center cursor-pointer transition-all hover:bg-orange-50/20 shadow-3xs flex flex-col justify-between items-center min-h-[90px]",
                    activePicker === "start"
                      ? "border-green-600 bg-green-50/10 ring-2 ring-green-600/10"
                      : errors.availableFrom
                        ? "border-red-500 bg-red-50/5 hover:bg-red-50/10"
                        : "border-gray-200/30 hover:border-green-600/30",
                  )}
                >
                  <CalendarPlus
                    className={cn(
                      "w-4 h-4 mx-auto mb-1.5 shrink-0",
                      errors.availableFrom ? "text-red-500" : "text-green-600",
                    )}
                  />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Bắt đầu ca
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold mt-1",
                      errors.availableFrom ? "text-red-600" : "text-gray-800",
                    )}
                  >
                    {getDisplayTime(availableFrom)}
                  </p>
                </div>

                <div
                  onClick={() => openPicker("end")}
                  className={cn(
                    "bg-gray-50 border rounded-2xl p-3 px-4 text-center cursor-pointer transition-all hover:bg-orange-50/20 shadow-3xs flex flex-col justify-between items-center min-h-[90px]",
                    activePicker === "end"
                      ? "border-red-500 bg-red-50/10 ring-2 ring-red-500/10"
                      : errors.availableTo
                        ? "border-red-500 bg-red-50/5 hover:bg-red-50/10"
                        : "border-gray-200/30 hover:border-red-500/30",
                  )}
                >
                  <Lock className="w-4 h-4 text-red-500 mx-auto mb-1.5 shrink-0" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Kết thúc ca
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold mt-1",
                      errors.availableTo ? "text-red-600" : "text-gray-800",
                    )}
                  >
                    {getDisplayTime(availableTo)}
                  </p>
                </div>

                <div
                  onClick={() => openPicker("deadline")}
                  className={cn(
                    "bg-gray-50 border rounded-2xl p-3 px-4 text-center cursor-pointer transition-all hover:bg-orange-50/20 shadow-3xs flex flex-col justify-between items-center min-h-[90px]",
                    activePicker === "deadline"
                      ? "border-blue-500 bg-blue-50/10 ring-2 ring-blue-500/10"
                      : errors.finalizationDeadline
                        ? "border-red-500 bg-red-50/5 hover:bg-red-50/10"
                        : "border-gray-200/30 hover:border-blue-500/30",
                  )}
                >
                  <Hourglass
                    className={cn(
                      "w-4 h-4 mx-auto mb-1.5 shrink-0",
                      errors.finalizationDeadline ? "text-red-500" : "text-blue-500",
                    )}
                  />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Hạn Chuẩn Bị
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold mt-1",
                      errors.finalizationDeadline ? "text-red-600" : "text-gray-800",
                    )}
                  >
                    {getDisplayTime(finalizationDeadline)}
                  </p>
                </div>
              </div>

              {/* Inline errors for timeline */}
              {(errors.availableFrom ||
                errors.availableTo ||
                errors.availableForOrder ||
                errors.finalizationDeadline) && (
                <div className="space-y-1 mt-2 bg-red-50/50 border border-red-100 rounded-2xl p-3.5 animate-fade-in">
                  {errors.availableForOrder && (
                    <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                      ⚠️ {errors.availableForOrder}
                    </p>
                  )}
                  {errors.availableFrom && (
                    <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                      ⚠️ {errors.availableFrom}
                    </p>
                  )}
                  {errors.availableTo && (
                    <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                      ⚠️ {errors.availableTo}
                    </p>
                  )}
                  {errors.finalizationDeadline && (
                    <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                      ⚠️ {errors.finalizationDeadline}
                    </p>
                  )}
                </div>
              )}

              {/* Inline StaticTimePicker (No popup) */}
              {activePicker && mounted && (
                <div className="mt-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-200/35 flex flex-col items-center gap-4 shadow-3xs animate-fade-in select-none">
                  <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider border-b border-gray-200/50 pb-2 w-full text-center">
                    Chọn giờ:{" "}
                    {activePicker === "order"
                      ? "Thời gian mở đặt"
                      : activePicker === "start"
                        ? "Thời gian Bắt đầu ca"
                        : activePicker === "end"
                          ? "Thời gian Kết thúc ca"
                          : "Hạn Bếp chuẩn bị xong"}
                  </h4>

                  <div className="flex justify-center w-full py-2 bg-white rounded-2xl border border-gray-200/20 shadow-3xs overflow-hidden">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <StaticTimePicker
                        displayStaticWrapperAs="desktop"
                        orientation="landscape"
                        value={tempTime}
                        onChange={(newTime) => setTempTime(newTime)}
                        slotProps={{
                          actionBar: { actions: [] },
                          toolbar: {
                            hidden: false,
                            sx: {
                              "& .MuiTypography-root": {
                                color: "#111827",
                                fontWeight: "bold",
                              },
                              "& .MuiPickersToolbarText-root": {
                                color: "#4b5563",
                              },
                              "& .MuiPickersToolbarText-root.Mui-selected": {
                                color: "#D35400",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="flex items-center gap-3 w-full max-w-md">
                    <button
                      type="button"
                      onClick={() => setActivePicker(null)}
                      className="flex-1 py-2.5 border border-gray-200/50 hover:border-gray-300 text-gray-600 rounded-xl text-sm font-bold hover:bg-white transition-all shadow-3xs cursor-pointer active:scale-95"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-black hover:bg-[#b84900] transition-all shadow-3xs cursor-pointer active:scale-95"
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Limits Configuration */}
          <div
            className={cn(
              "bg-white rounded-3xl border p-6 sm:p-8 space-y-6 shadow-3xs transition-colors duration-300",
              errors.templatesName || errors.templatesSettings
                ? "border-red-400 bg-red-50/5"
                : "border-gray-200/35",
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                📂 Định mức Khuôn mẫu (Meal Templates)
              </h2>
              <button
                type="button"
                onClick={addTemplate}
                className="px-4 py-2 bg-[#D35400]/10 hover:bg-[#D35400]/20 text-[#D35400] text-xs font-black uppercase tracking-wider rounded-xl transition-colors border border-[#D35400]/10"
              >
                + Thêm mẫu
              </button>
            </div>

            {(errors.templatesName || errors.templatesSettings) && (
              <div className="space-y-1 bg-red-50/80 border border-red-100 rounded-2xl p-3.5 animate-fade-in">
                {errors.templatesName && (
                  <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                    ⚠️ {errors.templatesName}
                  </p>
                )}
                {errors.templatesSettings && (
                  <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5">
                    ⚠️ {errors.templatesSettings}
                  </p>
                )}
              </div>
            )}

            {selectedCategoryIds.size === 0 ? (
              <p className="text-gray-400 text-sm font-bold text-center py-6">
                Chưa có món ăn được chọn. Kéo thả món ăn bên phải để thiết lập định mức.
              </p>
            ) : (
              <div className="space-y-6">
                {templates.map((template, tIdx) => (
                  <div
                    key={tIdx}
                    className="bg-gray-50/70 border border-gray-200/25 rounded-3xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <input
                        value={template.name}
                        onChange={(e) => updateTemplateName(tIdx, e.target.value)}
                        placeholder="e.g. Suất ăn chay, Suất giàu đạm"
                        className="font-bold text-gray-800 bg-white border border-gray-200/35 rounded-xl px-3 py-2 text-sm max-w-xs focus:ring-1 focus:ring-[#D35400] shadow-3xs"
                      />
                      {templates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTemplate(tIdx)}
                          className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-wider"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {template.settings.map((s, sIdx) => {
                        const cat = categoryMap[s.categoryId];
                        return (
                          <div
                            key={sIdx}
                            className="bg-white rounded-2xl border border-gray-200/25 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cat?.imgUrl ? (
                                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                  <Image
                                    src={cat.imgUrl}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                  />
                                </div>
                              ) : (
                                <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs shrink-0">
                                  📁
                                </span>
                              )}
                              <span className="font-bold text-gray-800 text-sm truncate">
                                {cat?.name || "—"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-bold">Min:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={s.maxQuantity}
                                  value={s.minQuantity}
                                  onChange={(e) =>
                                    updateTemplateSetting(
                                      tIdx,
                                      sIdx,
                                      "minQuantity",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-12 text-center border border-gray-200 rounded-lg p-1 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400]"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-bold">Max:</span>
                                <input
                                  type="number"
                                  min={s.minQuantity}
                                  value={s.maxQuantity}
                                  onChange={(e) =>
                                    updateTemplateSetting(
                                      tIdx,
                                      sIdx,
                                      "maxQuantity",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-12 text-center border border-gray-200 rounded-lg p-1 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400]"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  id={`req-${tIdx}-${sIdx}`}
                                  checked={s.isRequired}
                                  onChange={(e) =>
                                    updateTemplateSetting(
                                      tIdx,
                                      sIdx,
                                      "isRequired",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 accent-[#D35400] rounded-sm cursor-pointer"
                                />
                                <label
                                  htmlFor={`req-${tIdx}-${sIdx}`}
                                  className="text-xs font-bold text-gray-500 cursor-pointer select-none"
                                >
                                  Bắt buộc
                                </label>
                              </div>
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

        {/* Right Column: Drag and Drop Workspace */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-0">
          {/* Mapped Session Dishes Pool (Drop zone) */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOverDropZone}
            onDragLeave={() => setIsDragOverDropZone(false)}
            onDrop={handleDropToSelected}
            className={cn(
              "bg-white rounded-3xl border p-6 min-h-[16rem] transition-all duration-300 flex flex-col shadow-3xs",
              isDragOverDropZone
                ? "bg-orange-50/40 border-dashed border-[#D35400] ring-2 ring-[#D35400]/10 scale-[1.01]"
                : errors.dishes
                  ? "border-red-400 bg-red-50/5"
                  : "border-gray-150",
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 shrink-0">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <ChefHat
                  className={cn("w-5 h-5", errors.dishes ? "text-red-500" : "text-[#D35400]")}
                />
                Món ăn phục vụ
              </h2>
              <span
                ref={counterRef}
                className={cn(
                  "border text-xs font-black px-3 py-1 rounded-full shadow-3xs transition-colors duration-300",
                  errors.dishes
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "bg-orange-50 border-orange-100/50 text-[#D35400]",
                )}
              >
                {selectedDishes.length} món
              </span>
            </div>

            {selectedDishes.length === 0 ? (
              <div
                className={cn(
                  "flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl transition-colors duration-300",
                  errors.dishes
                    ? "border-red-300 bg-red-50/20"
                    : "border-gray-200/30 bg-gray-50/50",
                )}
              >
                <Package
                  className={cn(
                    "w-10 h-10 mb-2 transition-colors",
                    errors.dishes ? "text-red-400" : "text-gray-300",
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-bold transition-colors",
                    errors.dishes ? "text-red-500" : "text-gray-400",
                  )}
                >
                  {errors.dishes ? errors.dishes : "Kéo thả món ăn vào đây để đưa vào thực đơn ca"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[22rem] overflow-y-auto pr-1">
                {selectedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dish.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "selected-dish-item drag-item dish-pop-in flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#D35400]/15 shadow-3xs hover:shadow-sm hover:border-[#D35400]/30 group transition-all cursor-grab active:cursor-grabbing",
                      draggedDishId === dish.id && "opacity-45",
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDish(dish.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Dishes Pool */}
          <div
            onDragOver={handleDragOverPool}
            onDragLeave={() => setIsDragOverPool(false)}
            onDrop={handleDropToPool}
            className={cn(
              "bg-white rounded-3xl border p-6 min-h-[22rem] flex flex-col shadow-3xs transition-all duration-300",
              isDragOverPool
                ? "bg-gray-50 border-dashed border-gray-400 scale-[1.01]"
                : "border-gray-200/30",
            )}
          >
            <div className="border-b border-gray-100 pb-3 mb-4 shrink-0 space-y-3">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Kho món ăn sẵn có
              </h2>

              {/* Filters & Search */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    placeholder="Tìm kiếm món ăn..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200/35 rounded-xl outline-none focus:ring-1 focus:ring-[#D35400] text-xs font-medium text-gray-800 placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1 select-none">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                      categoryFilter === "all"
                        ? "bg-[#D35400] text-white shadow-3xs"
                        : "bg-gray-100 text-gray-500 hover:text-gray-800",
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
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                        categoryFilter === catId
                          ? "bg-[#D35400] text-white shadow-3xs"
                          : "bg-gray-100 text-gray-500 hover:text-gray-800",
                      )}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Pool Grid */}
            <div
              ref={poolGridRef}
              className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[18rem]"
            >
              {availableDishes.length === 0 ? (
                <p className="text-gray-400 text-xs font-bold text-center py-10 col-span-2">
                  Không tìm thấy món ăn nào khả dụng.
                </p>
              ) : (
                availableDishes.map((dish) => (
                  <div
                    key={dish.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dish.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => toggleDish(dish.id)}
                    onMouseEnter={handleElasticHover}
                    className={cn(
                      "dish-card-pool drag-item flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200/30 hover:shadow-sm hover:border-[#D35400]/20 transition-all cursor-grab active:cursor-grabbing",
                      draggedDishId === dish.id && "opacity-45",
                    )}
                  >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {dish.imgUrl ? (
                        <Image
                          src={dish.imgUrl}
                          alt={dish.name}
                          fill
                          className="object-cover pointer-events-none"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate uppercase tracking-wider">
                        {dish.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-gray-400 truncate max-w-[4rem]">
                          {dish.categoryName || "—"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-black text-[#D35400]">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 border border-gray-200/50 hover:border-gray-300 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-3xs"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
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
