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
  Lock,
  Trash2,
  Hourglass,
} from "lucide-react";
import { animate, stagger } from "animejs";
import { spring } from "animejs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { toast } from "sonner";

interface LocalTemplate extends CreateSessionTemplate {
  dishIds: string[];
}

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
  const [clickedFields, setClickedFields] = useState<Set<string>>(new Set());
  const [selectedAddCat, setSelectedAddCat] = useState<Record<number, string>>({});
  const [editingTplIdx, setEditingTplIdx] = useState(-1);

  const handleTimeSelect = (
    field: "order" | "deadline" | "start" | "end",
    time: dayjs.Dayjs | null,
  ) => {
    let newForOrder = availableForOrder;
    let newDeadline = finalizationDeadline;
    let newFrom = availableFrom;
    let newTo = availableTo;

    const clear = () => {
      if (field === "order") {
        setAvailableForOrder("");
        newForOrder = "";
      } else if (field === "deadline") {
        setFinalizationDeadline("");
        newDeadline = "";
      } else if (field === "start") {
        setAvailableFrom("");
        newFrom = "";
      } else if (field === "end") {
        setAvailableTo("");
        newTo = "";
      }
    };

    if (!time) {
      clear();
    } else {
      const dateStr = sessionDate || dayjs().format("YYYY-MM-DD");
      if (!sessionDate) setSessionDate(dateStr);
      const fullStr = `${dateStr}T${time.format("HH:mm")}`;
      if (field === "order") {
        setAvailableForOrder(fullStr);
        newForOrder = fullStr;
      } else if (field === "deadline") {
        setFinalizationDeadline(fullStr);
        newDeadline = fullStr;
      } else if (field === "start") {
        setAvailableFrom(fullStr);
        newFrom = fullStr;
      } else if (field === "end") {
        setAvailableTo(fullStr);
        newTo = fullStr;
      }
    }

    const t: Record<string, string> = {};
    if (newForOrder && dayjs(newForOrder).isBefore(dayjs()))
      t.availableForOrder = "Giờ mở đặt không được ở trong quá khứ.";
    if (newForOrder && newDeadline && new Date(newForOrder) >= new Date(newDeadline))
      t.availableForOrder = "Giờ mở đặt phải trước hạn chốt món.";
    if (newDeadline && newFrom && new Date(newDeadline) >= new Date(newFrom))
      t.finalizationDeadline = "Hạn chốt món phải trước giờ bắt đầu ca.";
    if (newFrom && newTo && new Date(newFrom) >= new Date(newTo))
      t.availableTo = "Thời gian kết thúc phải sau thời gian bắt đầu ca.";

    setErrors((prev) => {
      const next = { ...prev };
      delete next.availableFrom;
      delete next.availableTo;
      delete next.availableForOrder;
      delete next.finalizationDeadline;
      return { ...next, ...t };
    });
  };

  const toMinutes = (dt: string) => {
    const d = dayjs(dt);
    return d.hour() * 60 + d.minute();
  };

  const [dishSearch, setDishSearch] = useState("");
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
  const [draggedDishId, setDraggedDishId] = useState<string | null>(null);
  const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);
  const [isDragOverPool, setIsDragOverPool] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [templates, setTemplates] = useState<LocalTemplate[]>([
    {
      name: "Suất chuẩn",
      settings: [],
      dishIds: [],
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
          if (detail.finalizationDeadline)
            setFinalizationDeadline(toDatetimeLocal(detail.finalizationDeadline));
          setSessionDate(toDatetimeLocal(detail.availableFrom).split("T")[0]);
          setSelectedDishIds(new Set(detail.dishes.map((d) => d.dishId)));
          setTemplates(
            detail.mealTemplates.map((t, idx) => ({
              name: t.name,
              settings: t.settings,
              dishIds: idx === 0 ? detail.dishes.map((d) => d.dishId) : [],
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

  const allSelectedDishIds = useMemo(
    () =>
      new Set([
        ...selectedDishIds,
        ...templates.flatMap((t, i) => (i === editingTplIdx ? [] : t.dishIds)),
      ]),
    [selectedDishIds, templates, editingTplIdx],
  );

  const allSessionCategoryIds = useMemo(
    () =>
      new Set(
        dishes
          .filter((d) => allSelectedDishIds.has(d.id))
          .map((d) => d.categoryId)
          .filter(Boolean) as string[],
      ),
    [dishes, allSelectedDishIds],
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
        dishIds: [],
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
              settings: t.settings.map((s, j) =>
                j === sIdx
                  ? field === "isRequired"
                    ? {
                        ...s,
                        isRequired: value as boolean,
                        minQuantity: value ? 1 : 0,
                        maxQuantity: value ? 2 : 1,
                      }
                    : { ...s, [field]: value }
                  : s,
              ),
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

  const removeTemplateSetting = (tIdx: number, sIdx: number) => {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx ? { ...t, settings: t.settings.filter((_, j) => j !== sIdx) } : t,
      ),
    );
  };

  const addMissingCategories = (tIdx: number) => {
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (i !== tIdx) return t;
        const existingIds = new Set(t.settings.map((s) => s.categoryId));
        const missing = [...allSessionCategoryIds].filter((catId) => !existingIds.has(catId));
        if (missing.length === 0) return t;
        return {
          ...t,
          settings: [
            ...t.settings,
            ...missing.map((catId) => ({
              categoryId: catId,
              minQuantity: 0,
              maxQuantity: 1,
              isRequired: false,
            })),
          ],
        };
      }),
    );
  };

  const finalizeTemplate = (tIdx: number) => {
    setTemplates((prev) =>
      prev.map((t, i) => (i === tIdx ? { ...t, dishIds: [...selectedDishIds] } : t)),
    );
    setSelectedDishIds(new Set());
    setEditingTplIdx(-1);
  };

  const editTemplateDishes = (tIdx: number) => {
    const t = templates[tIdx];
    if (!t) return;
    setSelectedDishIds(new Set(t.dishIds));
    setEditingTplIdx(tIdx);
  };

  const addCategoryToTemplate = (tIdx: number, catId: string) => {
    if (!catId) return;
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (i !== tIdx) return t;
        if (t.settings.some((s) => s.categoryId === catId)) return t;
        return {
          ...t,
          settings: [
            ...t.settings,
            { categoryId: catId, minQuantity: 0, maxQuantity: 1, isRequired: false },
          ],
        };
      }),
    );
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (t.dishIds.length > 0 && editingTplIdx !== i) return t;
        const existingIds = new Set(t.settings.map((s) => s.categoryId));
        const newCats = [...selectedCategoryIds].filter((catId) => !existingIds.has(catId));
        if (newCats.length === 0) return t;
        return {
          ...t,
          settings: [
            ...t.settings,
            ...newCats.map((catId) => ({
              categoryId: catId,
              minQuantity: 0,
              maxQuantity: 1,
              isRequired: false,
            })),
          ],
        };
      }),
    );
  }, [selectedCategoryIds, editingTplIdx]);

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
    if (!finalizationDeadline) errs.finalizationDeadline = "Hạn chốt món là bắt buộc.";

    if (availableForOrder && dayjs(availableForOrder).isBefore(dayjs()))
      errs.availableForOrder = "Thời gian mở đặt không được ở trong quá khứ.";
    if (
      availableForOrder &&
      finalizationDeadline &&
      new Date(availableForOrder) >= new Date(finalizationDeadline)
    )
      errs.availableForOrder = "Giờ mở đặt phải trước hạn chốt món.";
    if (
      finalizationDeadline &&
      availableFrom &&
      new Date(finalizationDeadline) >= new Date(availableFrom)
    )
      errs.finalizationDeadline = "Hạn chốt món phải trước giờ bắt đầu ca.";
    if (availableFrom && availableTo && new Date(availableFrom) >= new Date(availableTo))
      errs.availableTo = "Thời gian kết thúc phải sau thời gian bắt đầu ca.";
    const totalDishes = new Set([
      ...selectedDishIds,
      ...templates.flatMap((t, i) => (i === editingTplIdx ? [] : t.dishIds)),
    ]);
    if (totalDishes.size === 0) errs.dishes = "Vui lòng chọn ít nhất một món ăn.";
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
      dishes: Array.from(
        new Set([
          ...selectedDishIds,
          ...templates.flatMap((t, i) => (i === editingTplIdx ? [] : t.dishIds)),
        ]),
      ).map((dishId) => ({ dishId })),
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
                          `${newD}T${finalizationDeadline.split("T")[1] || "09:30"}`,
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

              {/* MUI TimePickers */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div
                    className="flex flex-col gap-1.5"
                    onClick={() => setClickedFields((prev) => new Set(prev).add("order"))}
                  >
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-[#D35400]" />
                      Mở đặt
                    </label>
                    <TimePicker
                      ampm={false}
                      value={availableForOrder ? dayjs(availableForOrder) : null}
                      onChange={(v) => handleTimeSelect("order", v)}
                      shouldDisableTime={(value) => {
                        const val = toMinutes(value.format("YYYY-MM-DDTHH:mm"));
                        if (
                          sessionDate === dayjs().format("YYYY-MM-DD") &&
                          val <= toMinutes(dayjs().format("YYYY-MM-DDTHH:mm"))
                        )
                          return true;
                        if (finalizationDeadline && val >= toMinutes(finalizationDeadline))
                          return true;
                        if (availableFrom && val >= toMinutes(availableFrom)) return true;
                        if (availableTo && val >= toMinutes(availableTo)) return true;
                        return false;
                      }}
                      disabled={!sessionDate}
                      slotProps={{
                        textField: {
                          size: "small",
                          error: !!errors.availableForOrder,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "16px",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              backgroundColor: "#fff",
                            },
                          },
                        },
                      }}
                    />
                    {clickedFields.has("order") && (!sessionDate || errors.availableForOrder) && (
                      <p className="text-[11px] font-semibold text-red-500">
                        ⚠️{" "}
                        {!sessionDate
                          ? "Vui lòng chọn ngày phục vụ trước"
                          : errors.availableForOrder}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex flex-col gap-1.5"
                    onClick={() => setClickedFields((prev) => new Set(prev).add("deadline"))}
                  >
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Hourglass className="w-3 h-3 text-blue-500" />
                      Hạn chốt món
                    </label>
                    <TimePicker
                      ampm={false}
                      value={finalizationDeadline ? dayjs(finalizationDeadline) : null}
                      onChange={(v) => handleTimeSelect("deadline", v)}
                      shouldDisableTime={(value) => {
                        const val = toMinutes(value.format("YYYY-MM-DDTHH:mm"));
                        if (availableForOrder && val <= toMinutes(availableForOrder)) return true;
                        if (availableFrom && val >= toMinutes(availableFrom)) return true;
                        if (availableTo && val >= toMinutes(availableTo)) return true;
                        return false;
                      }}
                      disabled={!availableForOrder}
                      slotProps={{
                        textField: {
                          size: "small",
                          error: !!errors.finalizationDeadline,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "16px",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              backgroundColor: "#fff",
                            },
                          },
                        },
                      }}
                    />
                    {clickedFields.has("deadline") &&
                      (!availableForOrder || errors.finalizationDeadline) && (
                        <p className="text-[11px] font-semibold text-red-500">
                          ⚠️{" "}
                          {!availableForOrder
                            ? "Vui lòng chọn giờ mở đặt trước"
                            : errors.finalizationDeadline}
                        </p>
                      )}
                  </div>

                  <div
                    className="flex flex-col gap-1.5"
                    onClick={() => setClickedFields((prev) => new Set(prev).add("start"))}
                  >
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarPlus className="w-3 h-3 text-green-600" />
                      Bắt đầu ca
                    </label>
                    <TimePicker
                      ampm={false}
                      value={availableFrom ? dayjs(availableFrom) : null}
                      onChange={(v) => handleTimeSelect("start", v)}
                      shouldDisableTime={(value) => {
                        const val = toMinutes(value.format("YYYY-MM-DDTHH:mm"));
                        if (finalizationDeadline && val <= toMinutes(finalizationDeadline))
                          return true;
                        if (availableTo && val >= toMinutes(availableTo)) return true;
                        return false;
                      }}
                      disabled={!finalizationDeadline}
                      slotProps={{
                        textField: {
                          size: "small",
                          error: !!errors.availableFrom,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "16px",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              backgroundColor: "#fff",
                            },
                          },
                        },
                      }}
                    />
                    {clickedFields.has("start") &&
                      (!finalizationDeadline || errors.availableFrom) && (
                        <p className="text-[11px] font-semibold text-red-500">
                          ⚠️{" "}
                          {!finalizationDeadline
                            ? "Vui lòng chọn hạn chốt món trước"
                            : errors.availableFrom}
                        </p>
                      )}
                  </div>

                  <div
                    className="flex flex-col gap-1.5"
                    onClick={() => setClickedFields((prev) => new Set(prev).add("end"))}
                  >
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-red-500" />
                      Kết thúc ca
                    </label>
                    <TimePicker
                      ampm={false}
                      value={availableTo ? dayjs(availableTo) : null}
                      onChange={(v) => handleTimeSelect("end", v)}
                      shouldDisableTime={(value) => {
                        const val = toMinutes(value.format("YYYY-MM-DDTHH:mm"));
                        if (finalizationDeadline && val <= toMinutes(finalizationDeadline))
                          return true;
                        if (availableFrom && val <= toMinutes(availableFrom)) return true;
                        return false;
                      }}
                      disabled={!availableFrom}
                      slotProps={{
                        textField: {
                          size: "small",
                          error: !!errors.availableTo,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "16px",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              backgroundColor: "#fff",
                            },
                          },
                        },
                      }}
                    />
                    {clickedFields.has("end") && (!availableFrom || errors.availableTo) && (
                      <p className="text-[11px] font-semibold text-red-500">
                        ⚠️{" "}
                        {!availableFrom ? "Vui lòng chọn giờ bắt đầu ca trước" : errors.availableTo}
                      </p>
                    )}
                  </div>
                </div>
              </LocalizationProvider>
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

            {templates.every((t) => t.settings.length === 0 && t.dishIds.length === 0) &&
            selectedCategoryIds.size === 0 ? (
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
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          value={template.name}
                          onChange={(e) => updateTemplateName(tIdx, e.target.value)}
                          placeholder="e.g. Suất ăn chay, Suất giàu đạm"
                          className="font-bold text-gray-800 bg-white border border-gray-200/35 rounded-xl px-3 py-2 text-sm max-w-[10rem] focus:ring-1 focus:ring-[#D35400] shadow-3xs"
                        />
                        {template.dishIds.length > 0 && (
                          <span className="text-[10px] font-black text-[#D35400] bg-orange-50 border border-orange-200/50 px-2.5 py-1 rounded-full shrink-0">
                            {template.dishIds.length} món
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {template.dishIds.length > 0 && editingTplIdx !== tIdx ? (
                          <button
                            type="button"
                            onClick={() => editTemplateDishes(tIdx)}
                            className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                          >
                            Sửa
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => finalizeTemplate(tIdx)}
                            disabled={selectedDishIds.size === 0}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-40 hover:bg-green-700 transition-all active:scale-90"
                          >
                            Xong
                          </button>
                        )}
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

                              <button
                                type="button"
                                onClick={() => removeTemplateSetting(tIdx, sIdx)}
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0 transition-all active:scale-90"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <select
                        value={selectedAddCat[tIdx] || ""}
                        onChange={(e) =>
                          setSelectedAddCat((prev) => ({ ...prev, [tIdx]: e.target.value }))
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 bg-white focus:ring-1 focus:ring-[#D35400] outline-none"
                      >
                        <option value="">+ Chọn danh mục để thêm</option>
                        {categories
                          .filter((c) => !template.settings.some((s) => s.categoryId === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          addCategoryToTemplate(tIdx, selectedAddCat[tIdx]);
                          setSelectedAddCat((prev) => ({ ...prev, [tIdx]: "" }));
                        }}
                        disabled={!selectedAddCat[tIdx]}
                        className="px-3 py-2 bg-[#D35400] text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-[#a84300] transition-all active:scale-90"
                      >
                        Thêm
                      </button>
                    </div>
                    {(() => {
                      const existingIds = new Set(template.settings.map((s) => s.categoryId));
                      const missingCount = [...allSessionCategoryIds].filter(
                        (id) => !existingIds.has(id),
                      ).length;
                      return missingCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => addMissingCategories(tIdx)}
                          className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:text-[#D35400] hover:border-[#D35400]/30 transition-colors"
                        >
                          + Thêm danh mục còn thiếu (từ món đã chọn)
                        </button>
                      ) : null;
                    })()}
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
