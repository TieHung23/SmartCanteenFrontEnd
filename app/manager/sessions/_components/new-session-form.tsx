"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type {
  CreateSessionRequest,
  CreateSessionTemplate,
  SessionListItem,
} from "@/types/session.types";
import { cn } from "@/lib/utils";
import {
  checkSessionOverlap,
  extractApiErrorMessage,
  formatSessionOverlapMessage,
  formatSessionRange,
  getSessionsForDate,
} from "@/lib/session-overlap";
import { slotConfigurationService } from "@/services/slot-configuration.service";
import { robotArmService } from "@/services/robot-arm.service";
import type { RobotArm } from "@/types/robot-arm.types";
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
  Clock,
  AlertTriangle,
  Route,
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
  initialDate?: string;
  onSuccess: (session: { id: string; name: string }) => void;
  onCancel: () => void;
}

export function NewSessionForm({
  copyFromId: copyFrom,
  initialDate,
  onSuccess,
  onCancel,
}: NewSessionFormProps) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingSessions, setExistingSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [availableForOrder, setAvailableForOrder] = useState("");
  const defaultInitialDate = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    if (!initialDate) return todayStr;
    return dayjs(initialDate).isBefore(dayjs(), "day") ? todayStr : initialDate;
  }, [initialDate]);

  const [sessionDate, setSessionDate] = useState(defaultInitialDate);
  const [orderOpenDate, setOrderOpenDate] = useState(defaultInitialDate);
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
      if (field === "order") {
        const dateStr = orderOpenDate || dayjs().format("YYYY-MM-DD");
        if (!orderOpenDate) setOrderOpenDate(dateStr);
        const fullStr = `${dateStr}T${time.format("HH:mm")}`;
        setAvailableForOrder(fullStr);
        newForOrder = fullStr;
      } else {
        const baseDate = sessionDate || dayjs().format("YYYY-MM-DD");
        if (!sessionDate) setSessionDate(baseDate);
        if (field === "deadline") {
          const fullStr = `${baseDate}T${time.format("HH:mm")}`;
          setFinalizationDeadline(fullStr);
          newDeadline = fullStr;
        } else if (field === "start") {
          const startTime = time.format("HH:mm");
          const fullStr = `${baseDate}T${startTime}`;
          setAvailableFrom(fullStr);
          newFrom = fullStr;
          if (newTo) {
            const toTime = newTo.split("T")[1];
            if (toTime) {
              const endDateStr =
                toTime < startTime ? dayjs(baseDate).add(1, "day").format("YYYY-MM-DD") : baseDate;
              const updatedTo = `${endDateStr}T${toTime}`;
              setAvailableTo(updatedTo);
              newTo = updatedTo;
            }
          }
        } else if (field === "end") {
          const endTime = time.format("HH:mm");
          const startTime = newFrom ? newFrom.split("T")[1] : "";
          const endDateStr =
            startTime && endTime < startTime
              ? dayjs(baseDate).add(1, "day").format("YYYY-MM-DD")
              : baseDate;
          const fullStr = `${endDateStr}T${endTime}`;
          setAvailableTo(fullStr);
          newTo = fullStr;
        }
      }
    }

    const t: Record<string, string> = {};
    // So sánh đầy đủ ngày + giờ, làm tròn tới phút (giống hàm validate)
    const orderAt = newForOrder ? dayjs(newForOrder) : null;
    const deadlineAt = newDeadline ? dayjs(newDeadline) : null;
    const fromAt = newFrom ? dayjs(newFrom) : null;
    const toAt = newTo ? dayjs(newTo) : null;

    if (orderAt && orderAt.isBefore(dayjs(), "minute"))
      t.availableForOrder = "Giờ mở đặt không được ở trong quá khứ.";
    if (orderAt && deadlineAt && !orderAt.isBefore(deadlineAt, "minute"))
      t.availableForOrder = "Giờ mở đặt phải trước hạn chốt món.";
    if (deadlineAt && fromAt && !deadlineAt.isBefore(fromAt, "minute"))
      t.finalizationDeadline = "Hạn chốt món phải trước giờ bắt đầu ca.";
    if (fromAt && toAt && !fromAt.isBefore(toAt, "minute"))
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

  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardLaneConfigs, setWizardLaneConfigs] = useState<
    Record<string, { laneCode: string; capacity: number; robotArmId: string }>
  >({});
  const [robotArms, setRobotArms] = useState<RobotArm[]>([]);

  // Tự động sinh danh sách mã Lane từ các RobotArm hiện có (mỗi RobotArm có 20 Lane L1 - L20)
  const allLaneOptions = useMemo(() => {
    const list: string[] = [];
    const arms =
      robotArms.length > 0 ? robotArms : [{ code: "S1" }, { code: "S2" }, { code: "S3" }];
    arms.forEach((arm) => {
      const code = (arm.code || "S1").toUpperCase();
      for (let i = 1; i <= 20; i++) {
        list.push(`${code}_L${i}`);
      }
    });
    return list;
  }, [robotArms]);

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWizardLaneConfigs((prev) => {
      const next = { ...prev };
      const claimedLanes = new Map<string, string>(); // laneCode -> dishId
      const usedLanes = new Set<string>();

      // Bước 1: Quét và giải phóng các Mã Lane bị TRÙNG lặp từ ca cũ
      selectedDishIds.forEach((dishId) => {
        const config = next[dishId];
        const rawCode = config?.laneCode?.trim()?.toUpperCase();

        if (rawCode && !claimedLanes.has(rawCode)) {
          claimedLanes.set(rawCode, dishId);
          usedLanes.add(rawCode);
        } else if (config) {
          // Xóa mã trùng lặp để gán lại mã duy nhất
          next[dishId] = { ...config, laneCode: "" };
        }
      });

      // Bước 2: Tự động gán Mã Lane duy nhất chưa sử dụng cho mọi món ăn
      selectedDishIds.forEach((dishId) => {
        if (!next[dishId] || !next[dishId].laneCode?.trim()) {
          let defaultLane = allLaneOptions.find((l) => !usedLanes.has(l.toUpperCase()));
          if (!defaultLane) {
            const armCode = (robotArms[0]?.code || "S1").toUpperCase();
            let counter = 1;
            while (usedLanes.has(`${armCode}_L${counter}`)) {
              counter++;
            }
            defaultLane = `${armCode}_L${counter}`;
          }
          usedLanes.add(defaultLane.toUpperCase());
          const armPrefix = defaultLane.split("_")[0];
          const matchingArm = robotArms.find((a) => (a.code || "").toUpperCase() === armPrefix);
          next[dishId] = {
            laneCode: defaultLane,
            capacity: next[dishId]?.capacity || 12,
            robotArmId: matchingArm
              ? matchingArm.id
              : next[dishId]?.robotArmId || robotArms[0]?.id || "",
          };
        }
      });
      return next;
    });
  }, [selectedDishIds, allLaneOptions, robotArms]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dishResult, catResult, sessionResult, armsResult] = await Promise.all([
          dishService.getDishes({ isActive: true, pageSize: 100 }),
          categoryService.getAll(),
          sessionService
            .getSessions({ pageSize: 1000 })
            .catch(() => ({ items: [] as SessionListItem[] })),
          robotArmService.getList().catch(() => [] as RobotArm[]),
        ]);
        setDishes(dishResult.items);
        setCategories(catResult.items);
        setExistingSessions(sessionResult.items || []);
        setRobotArms(armsResult);

        if (copyFrom) {
          const [detail, existingConfigs] = await Promise.all([
            sessionService.getSessionDetail(copyFrom),
            slotConfigurationService.getBySession(copyFrom).catch(() => []),
          ]);

          setName(detail.name);
          setDescription(detail.description);
          setAvailableFrom(toDatetimeLocal(detail.availableFrom));
          setAvailableTo(toDatetimeLocal(detail.availableTo));
          setAvailableForOrder(toDatetimeLocal(detail.availableForOrder));
          if (detail.finalizationDeadline)
            setFinalizationDeadline(toDatetimeLocal(detail.finalizationDeadline));
          const todayStr = dayjs().format("YYYY-MM-DD");
          const copiedOrderDate = toDatetimeLocal(detail.availableForOrder).split("T")[0];
          const copiedSessionDate = toDatetimeLocal(detail.availableFrom).split("T")[0];

          setOrderOpenDate(
            dayjs(copiedOrderDate).isBefore(dayjs(), "day") ? todayStr : copiedOrderDate,
          );
          setSessionDate(
            dayjs(copiedSessionDate).isBefore(dayjs(), "day") ? todayStr : copiedSessionDate,
          );
          setSelectedDishIds(new Set(detail.dishes.map((d) => d.dishId)));
          setTemplates(
            detail.mealTemplates.map((t, idx) => ({
              name: t.name,
              settings: t.settings,
              dishIds: idx === 0 ? detail.dishes.map((d) => d.dishId) : [],
            })),
          );

          if (existingConfigs && existingConfigs.length > 0) {
            const copiedLaneMap: Record<
              string,
              { laneCode: string; capacity: number; robotArmId: string }
            > = {};
            existingConfigs.forEach((cfg) => {
              if (cfg.dishId && cfg.laneCode) {
                copiedLaneMap[cfg.dishId] = {
                  laneCode: cfg.laneCode,
                  capacity: cfg.capacity || 12,
                  robotArmId: cfg.robotArmId || "",
                };
              }
            });
            setWizardLaneConfigs(copiedLaneMap);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [copyFrom]);

  const sessionsForSelectedDate = useMemo(
    () => getSessionsForDate(sessionDate, existingSessions),
    [sessionDate, existingSessions],
  );

  const overlappingSessions = useMemo(
    () => checkSessionOverlap(availableFrom, availableTo, existingSessions),
    [availableFrom, availableTo, existingSessions],
  );

  const filteredDishes = useMemo(
    () =>
      dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
          d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase()),
      ),
    [dishes, dishSearch],
  );

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((c) => {
      if (c.id) {
        map[c.id] = c;
        map[c.id.toLowerCase()] = c;
        map[c.id.toUpperCase()] = c;
      }
    });
    return map;
  }, [categories]);

  const selectedDishes = useMemo(
    () => dishes.filter((d) => selectedDishIds.has(d.id)),
    [dishes, selectedDishIds],
  );

  const selectedCategoryIds = useMemo(() => {
    const catIds = new Set<string>();
    selectedDishes.forEach((d) => {
      const obj = d as unknown as Record<string, unknown>;
      const catObj = obj.category as { id?: string } | undefined;
      const rawCatId =
        d.categoryId ||
        catObj?.id ||
        (typeof obj.CategoryId === "string" ? obj.CategoryId : undefined);
      if (rawCatId) {
        catIds.add(rawCatId);
      } else if (d.categoryName) {
        const matchedCat = categories.find(
          (c) => c.name?.trim().toLowerCase() === d.categoryName?.trim().toLowerCase(),
        );
        if (matchedCat?.id) {
          catIds.add(matchedCat.id);
        }
      }
    });
    return catIds;
  }, [selectedDishes, categories]);

  const allSelectedDishIds = useMemo(
    () =>
      new Set([
        ...selectedDishIds,
        ...templates.flatMap((t, i) => (i === editingTplIdx ? [] : t.dishIds)),
      ]),
    [selectedDishIds, templates, editingTplIdx],
  );

  const allSessionCategoryIds = useMemo(() => {
    const catIds = new Set<string>();
    dishes
      .filter((d) => allSelectedDishIds.has(d.id))
      .forEach((d) => {
        const obj = d as unknown as Record<string, unknown>;
        const catObj = obj.category as { id?: string } | undefined;
        const rawCatId =
          d.categoryId ||
          catObj?.id ||
          (typeof obj.CategoryId === "string" ? obj.CategoryId : undefined);
        if (rawCatId) {
          catIds.add(rawCatId);
        } else if (d.categoryName) {
          const matchedCat = categories.find(
            (c) => c.name?.trim().toLowerCase() === d.categoryName?.trim().toLowerCase(),
          );
          if (matchedCat?.id) {
            catIds.add(matchedCat.id);
          }
        }
      });
    return catIds;
  }, [dishes, allSelectedDishIds, categories]);

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
                    : field === "minQuantity" && s.isRequired
                      ? s
                      : field === "maxQuantity" && s.isRequired
                        ? { ...s, maxQuantity: Math.max(value as number, 2) }
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
        const missingDishIds = dishes
          .filter((d) => missing.includes(d.categoryId ?? ""))
          .map((d) => d.id);
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
          dishIds: [...new Set([...t.dishIds, ...missingDishIds])],
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
    const categoryDishIds = dishes.filter((d) => d.categoryId === catId).map((d) => d.id);
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
          dishIds: [...new Set([...t.dishIds, ...categoryDishIds])],
        };
      }),
    );
    setSelectedDishIds((prev) => new Set([...prev, ...categoryDishIds]));
  };

  useEffect(() => {
    // Tự động đồng bộ danh sách dishIds và category settings của các template khi thêm/bớt món hoặc sao chép ca
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (editingTplIdx === i) return t;

        const currentDishArr = Array.from(selectedDishIds);
        const existingCatIds = new Set(t.settings.map((s) => s.categoryId));
        const missingCats = [...selectedCategoryIds].filter((catId) => !existingCatIds.has(catId));

        const dishIdsMatch =
          t.dishIds.length === currentDishArr.length &&
          t.dishIds.every((id, idx) => id === currentDishArr[idx]);

        if (missingCats.length === 0 && dishIdsMatch) return t;

        const newSettings = [
          ...t.settings,
          ...missingCats.map((catId) => ({
            categoryId: catId,
            minQuantity: 0,
            maxQuantity: 1,
            isRequired: false,
          })),
        ];

        return {
          ...t,
          settings: newSettings,
          dishIds: currentDishArr,
        };
      }),
    );
  }, [selectedDishIds, selectedCategoryIds, editingTplIdx]);

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên ca phục vụ là bắt buộc.";
    if (!description.trim()) errs.description = "Mô tả ngắn gọn là bắt buộc.";
    if (!orderOpenDate) errs.orderOpenDate = "Ngày mở đặt là bắt buộc.";
    else if (dayjs(orderOpenDate).isBefore(dayjs().startOf("day")))
      errs.orderOpenDate = "Ngày mở đặt không được ở trong quá khứ.";
    if (!sessionDate) errs.sessionDate = "Ngày phục vụ là bắt buộc.";
    else if (dayjs(sessionDate).isBefore(dayjs().startOf("day")))
      errs.sessionDate = "Ngày phục vụ không được ở trong quá khứ.";

    if (!availableFrom) errs.availableFrom = "Thời gian bắt đầu ca là bắt buộc.";
    if (!availableTo) errs.availableTo = "Thời gian kết thúc ca là bắt buộc.";
    if (!availableForOrder) errs.availableForOrder = "Hạn chốt order là bắt buộc.";
    if (!finalizationDeadline) errs.finalizationDeadline = "Hạn chốt món là bắt buộc.";

    // So sánh đầy đủ ngày + giờ, làm tròn tới phút để không bị lệch bởi phần giây của thời điểm hiện tại
    const orderAt = availableForOrder ? dayjs(availableForOrder) : null;
    const deadlineAt = finalizationDeadline ? dayjs(finalizationDeadline) : null;
    const fromAt = availableFrom ? dayjs(availableFrom) : null;
    const toAt = availableTo ? dayjs(availableTo) : null;

    if (orderAt && orderAt.isBefore(dayjs(), "minute"))
      errs.availableForOrder = "Thời gian mở đặt không được ở trong quá khứ.";
    if (orderAt && deadlineAt && !orderAt.isBefore(deadlineAt, "minute"))
      errs.availableForOrder = "Giờ mở đặt phải trước hạn chốt món.";
    if (deadlineAt && fromAt && !deadlineAt.isBefore(fromAt, "minute"))
      errs.finalizationDeadline = "Hạn chốt món phải trước giờ bắt đầu ca.";
    if (fromAt && toAt && !fromAt.isBefore(toAt, "minute"))
      errs.availableTo = "Thời gian kết thúc phải sau thời gian bắt đầu ca.";
    const totalDishes = selectedDishIds;
    if (totalDishes.size === 0) errs.dishes = "Vui lòng chọn ít nhất một món ăn.";

    // 1. Chặn tạo phiên khi chưa tạo cấu hình Lane cho các món ăn
    const dishIdList = Array.from(totalDishes);
    const unconfiguredDishes = dishIdList.filter(
      (dishId) => !wizardLaneConfigs[dishId]?.laneCode?.trim(),
    );
    if (totalDishes.size > 0 && unconfiguredDishes.length > 0) {
      errs.lanes = `Bạn chưa cấu hình Lane cho ${unconfiguredDishes.length} món ăn!`;
    }

    // 2. Chặn tạo phiên khi có Mã Lane bị gán TRÙNG giữa các món ăn trong cùng 1 ca
    const laneUsageMap = new Map<string, string[]>();
    dishIdList.forEach((dishId) => {
      const code = wizardLaneConfigs[dishId]?.laneCode?.trim()?.toUpperCase();
      if (code) {
        const dish = dishes.find((d) => d.id === dishId);
        const name = dish ? dish.name : "Món ăn";
        const current = laneUsageMap.get(code) || [];
        current.push(name);
        laneUsageMap.set(code, current);
      }
    });

    const dupDetails: string[] = [];
    laneUsageMap.forEach((dishNames, laneCode) => {
      if (dishNames.length > 1) {
        dupDetails.push(
          `Mã Lane "${laneCode}" bị gán trùng cho ${dishNames.length} món (${dishNames.join(", ")})`,
        );
      }
    });

    if (dupDetails.length > 0) {
      errs.duplicateLanes = dupDetails.join("; ");
    }

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

      // Nếu thiếu cấu hình Lane hoặc bị TRÙNG Mã Lane -> CHẶN NGAY, không tạo session, tự động nhảy sang Bước 2!
      if (validationErrors.lanes || validationErrors.duplicateLanes) {
        setWizardStep(2);
        const title = validationErrors.duplicateLanes
          ? "Bị trùng mã Lane trong ca!"
          : "Bạn chưa tạo cấu hình Lane!";
        const desc = validationErrors.duplicateLanes || validationErrors.lanes;
        toast.error(title, {
          description: `${desc}. Vui lòng chỉnh sửa ở Bước 2 để mỗi món có 1 Mã Lane riêng trước khi tạo ca.`,
          duration: 7000,
        });
        return;
      }

      const FIELD_ORDER = [
        "name",
        "description",
        "orderOpenDate",
        "availableForOrder",
        "sessionDate",
        "finalizationDeadline",
        "availableFrom",
        "availableTo",
        "templatesName",
        "templatesSettings",
        "dishes",
      ];

      const firstKey = FIELD_ORDER.find((k) => validationErrors[k]);
      if (firstKey) {
        const el = document.getElementById(`field-${firstKey}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.focus({ preventScroll: true });
          }
        }
      }

      const firstErrorMsg = Object.values(validationErrors)[0];
      toast.error("Thông tin tạo ca chưa hợp lệ", {
        description: firstErrorMsg || "Vui lòng kiểm tra các trường bị lỗi.",
      });
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

    if (overlappingSessions.length > 0) {
      const overlapMsg = formatSessionOverlapMessage(
        availableFrom,
        availableTo,
        overlappingSessions,
      );
      toast.error(overlapMsg);
      setError(overlapMsg);
      setSubmitting(false);
      return;
    }

    try {
      const result = await sessionService.createSession(payload);
      const createdSessionId = result.value.id;

      // Create Lane configurations simultaneously if configured in wizard step 2
      const laneEntries = Object.entries(wizardLaneConfigs).filter(([dishId]) =>
        payload.dishes.some((d) => d.dishId === dishId),
      );

      if (laneEntries.length > 0) {
        let laneSuccessCount = 0;
        const laneErrorMsgs: string[] = [];

        for (const [dishId, cfg] of laneEntries) {
          if (!cfg.laneCode?.trim()) continue;
          const validArmId =
            cfg.robotArmId && robotArms.some((a) => a.id === cfg.robotArmId)
              ? cfg.robotArmId
              : null;
          try {
            await slotConfigurationService.create({
              sessionId: createdSessionId,
              dishId,
              laneCode: cfg.laneCode.trim().toUpperCase(),
              capacity: cfg.capacity || 12,
              robotArmId: validArmId,
            });
            laneSuccessCount++;
          } catch (laneErr) {
            console.warn(`[Slot Config Error] for dish ${dishId}:`, laneErr);
            const errDetail = extractApiErrorMessage(
              laneErr,
              `Lỗi mã lane ${cfg.laneCode.toUpperCase()}`,
            );
            laneErrorMsgs.push(errDetail);
          }
        }

        if (laneErrorMsgs.length > 0) {
          toast.warning(
            `Tạo ca "${result.value.name}" thành công! Lỗi gán Lane: ${laneErrorMsgs.join("; ")}`,
            { duration: 8000 },
          );
        } else if (laneSuccessCount > 0) {
          toast.success(
            `Tạo ca phục vụ "${result.value.name}" và gán ${laneSuccessCount} cấu hình Lane thành công!`,
          );
        } else {
          toast.success(
            `Tạo ca phục vụ "${result.value.name}" thành công! (Bạn có thể gán cấu hình Lane trong Chi tiết ca).`,
          );
        }
      } else {
        toast.success(`Tạo ca phục vụ "${result.value.name}" thành công!`);
      }

      onSuccess({ id: result.value.id, name: result.value.name });
    } catch (err: unknown) {
      console.error("[Session Create] Error:", err);
      const apiMsg = extractApiErrorMessage(err, "");
      let msg = apiMsg;
      if (!msg) {
        const conflicts = checkSessionOverlap(availableFrom, availableTo, existingSessions);
        if (conflicts.length > 0) {
          msg = formatSessionOverlapMessage(availableFrom, availableTo, conflicts);
        } else {
          msg = "Tạo ca phục vụ thất bại. Vui lòng thử lại.";
        }
      }
      toast.error(msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Đang tải dữ liệu biểu mẫu...</span>
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

      {/* 2-Step Wizard Stepper Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-3xl border border-gray-200 shadow-xs">
        <button
          type="button"
          onClick={() => setWizardStep(1)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-black transition-all",
            wizardStep === 1
              ? "bg-[#D35400] text-white shadow-md"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
          )}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] shrink-0">
            1
          </span>
          <CalendarPlus className="w-4 h-4 shrink-0" />
          <span>Thông tin chung & Món ăn ({selectedDishes.length} món)</span>
        </button>

        <button
          type="button"
          onClick={() => setWizardStep(2)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-black transition-all",
            wizardStep === 2
              ? "bg-[#D35400] text-white shadow-md"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
          )}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] shrink-0">
            2
          </span>
          <Route className="w-4 h-4 shrink-0" />
          <span>Cấu hình Lane & Sức chứa</span>
        </button>
      </div>

      {wizardStep === 2 && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Cấu hình Lane & Sức chứa cho các món ăn trong ca
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Gán Mã Lane (`S1_L1`, `S1_L2`, `S1_L3`), sức chứa tối đa và Robot Arm phụ trách
                  cho từng món ăn.
                </p>
              </div>
            </div>
          </div>

          {(errors.lanes || errors.duplicateLanes) && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold animate-shake">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-red-800">
                  ⚠️{" "}
                  {errors.duplicateLanes
                    ? "Mã Lane bị trùng giữa các món!"
                    : "Chưa chọn Mã Lane cho món ăn!"}
                </p>
                <p className="text-red-600 mt-0.5 font-medium leading-relaxed">
                  {errors.duplicateLanes || errors.lanes} Vui lòng chọn cho mỗi món một Mã Lane
                  riêng trước khi tạo ca.
                </p>
              </div>
            </div>
          )}

          {selectedDishes.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-400">
                Chưa có món ăn nào được chọn ở Tab 1.
              </p>
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="mt-3 text-xs font-bold text-[#D35400] underline"
              >
                Về Tab 1 để chọn món
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Món ăn
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Mã Lane
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Sức chứa (Khay)
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Tay máy Robot
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedDishes.map((dish) => {
                    const cfg = wizardLaneConfigs[dish.id] || {
                      laneCode: "S1_L1",
                      capacity: 12,
                      robotArmId: "",
                    };
                    const selectedArm = robotArms.find((a) => a.id === cfg.robotArmId);
                    const availableLanes = selectedArm
                      ? [
                          `${selectedArm.code.toUpperCase()}_L1`,
                          `${selectedArm.code.toUpperCase()}_L2`,
                          `${selectedArm.code.toUpperCase()}_L3`,
                        ]
                      : allLaneOptions;

                    return (
                      <tr key={dish.id} className="hover:bg-orange-50/20">
                        <td className="px-5 py-4 font-bold text-sm text-gray-900">{dish.name}</td>
                        <td className="px-5 py-4">
                          <select
                            value={cfg.laneCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              const armPrefix = val.split("_")[0];
                              const matchingArm = robotArms.find(
                                (a) => (a.code || "").toUpperCase() === armPrefix,
                              );
                              setWizardLaneConfigs((prev) => ({
                                ...prev,
                                [dish.id]: {
                                  ...cfg,
                                  laneCode: val,
                                  robotArmId: matchingArm ? matchingArm.id : cfg.robotArmId,
                                },
                              }));
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-mono text-sm font-bold text-gray-900 focus:border-[#D35400] outline-none shadow-xs"
                          >
                            {availableLanes.map((lane) => (
                              <option key={lane} value={lane}>
                                {lane}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min={1}
                            value={cfg.capacity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setWizardLaneConfigs((prev) => ({
                                ...prev,
                                [dish.id]: { ...cfg, capacity: val },
                              }));
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold w-24 focus:border-[#D35400] outline-none"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={cfg.robotArmId}
                            onChange={(e) => {
                              const armId = e.target.value;
                              const arm = robotArms.find((a) => a.id === armId);
                              const newLaneCode = arm
                                ? `${arm.code.toUpperCase()}_L1`
                                : cfg.laneCode;
                              setWizardLaneConfigs((prev) => ({
                                ...prev,
                                [dish.id]: {
                                  ...cfg,
                                  robotArmId: armId,
                                  laneCode: newLaneCode,
                                },
                              }));
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-[#D35400] outline-none"
                          >
                            <option value="">-- Tự phục vụ --</option>
                            {robotArms.map((arm) => (
                              <option key={arm.id} value={arm.id}>
                                {arm.name ? `${arm.code} - ${arm.name}` : arm.code}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2-Column Responsive Workspace */}
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
          wizardStep === 2 && "hidden",
        )}
      >
        {/* Left Column: Form Details & Templates */}
        <div className="lg:col-span-6 space-y-8">
          {/* General Metadata */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-[#D35400]" />
              Thiết lập chung
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-500 uppercase tracking-wider mb-2">
                  Tên ca phục vụ *
                </label>
                <input
                  id="field-name"
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
                    "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all shadow-xs text-sm",
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
                <label className="block text-sm font-black text-gray-500 uppercase tracking-wider mb-2">
                  Mô tả ngắn gọn *
                </label>
                <textarea
                  id="field-description"
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
                    "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all resize-none shadow-xs text-sm",
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

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {/* Order Open Section */}
                <div className="bg-orange-50/20 border border-orange-200/30 rounded-3xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-[#D35400] uppercase tracking-wider flex items-center gap-2">
                    <Play className="w-4 h-4" /> Mở đặt
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="field-orderOpenDate">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                        Ngày mở đặt
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-1 bg-[#D35400] rounded-l-2xl z-10" />
                        <input
                          type="date"
                          min={dayjs().format("YYYY-MM-DD")}
                          value={orderOpenDate}
                          onChange={(e) => {
                            const newD = e.target.value;
                            setOrderOpenDate(newD);
                            if (availableForOrder)
                              setAvailableForOrder(
                                `${newD}T${availableForOrder.split("T")[1] || "07:00"}`,
                              );
                            if (errors.orderOpenDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.orderOpenDate;
                                return next;
                              });
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all shadow-xs text-sm cursor-pointer",
                            errors.orderOpenDate
                              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                              : "border-orange-200/60 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900",
                          )}
                        />
                      </div>
                      {errors.orderOpenDate && (
                        <p className="text-red-500 text-xs font-semibold mt-1 ml-1">
                          {errors.orderOpenDate}
                        </p>
                      )}
                    </div>
                    <div
                      id="field-availableForOrder"
                      className="flex flex-col gap-1.5"
                      onClick={() => setClickedFields((prev) => new Set(prev).add("order"))}
                    >
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        Giờ
                      </label>
                      <TimePicker
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        minutesStep={1}
                        value={availableForOrder ? dayjs(availableForOrder) : null}
                        onChange={(v) => handleTimeSelect("order", v)}
                        shouldDisableTime={(value, view) => {
                          const isToday = orderOpenDate === dayjs().format("YYYY-MM-DD");
                          if (isToday && view === "hours" && value.hour() < dayjs().hour())
                            return true;
                          if (
                            isToday &&
                            view === "minutes" &&
                            value.hour() === dayjs().hour() &&
                            value.minute() <= dayjs().minute()
                          )
                            return true;
                          if (orderOpenDate === sessionDate && finalizationDeadline) {
                            const dl = dayjs(finalizationDeadline);
                            if (view === "hours" && value.hour() > dl.hour()) return true;
                            if (
                              view === "minutes" &&
                              value.hour() === dl.hour() &&
                              value.minute() >= dl.minute()
                            )
                              return true;
                          }
                          return false;
                        }}
                        disabled={!orderOpenDate}
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
                      {clickedFields.has("order") &&
                        (!orderOpenDate || errors.availableForOrder) && (
                          <p className="text-xs font-semibold text-red-500">
                            ⚠️{" "}
                            {!orderOpenDate ? "Chọn ngày mở đặt trước" : errors.availableForOrder}
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {/* Service Section */}
                <div className="bg-blue-50/20 border border-blue-200/30 rounded-3xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4" /> Phục vụ
                  </h3>
                  <div id="field-sessionDate">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                      Ngày phục vụ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 rounded-l-2xl z-10" />
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
                          if (finalizationDeadline)
                            setFinalizationDeadline(
                              `${newD}T${finalizationDeadline.split("T")[1] || "09:30"}`,
                            );
                        }}
                        className={cn(
                          "w-full px-4 py-3 bg-white border rounded-2xl outline-none focus:ring-2 transition-all shadow-xs text-sm cursor-pointer",
                          errors.sessionDate
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                            : "border-blue-200/60 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900",
                        )}
                      />
                    </div>
                    {errors.sessionDate && (
                      <p className="text-red-500 text-xs font-semibold mt-1 ml-1">
                        {errors.sessionDate}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      id="field-finalizationDeadline"
                      className="flex flex-col gap-1.5"
                      onClick={() => setClickedFields((prev) => new Set(prev).add("deadline"))}
                    >
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Hourglass className="w-3 h-3 text-blue-500" />
                        Hạn chốt món
                      </label>
                      <TimePicker
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        minutesStep={1}
                        value={finalizationDeadline ? dayjs(finalizationDeadline) : null}
                        onChange={(v) => handleTimeSelect("deadline", v)}
                        shouldDisableTime={(value, view) => {
                          if (availableForOrder && orderOpenDate === sessionDate) {
                            const order = dayjs(availableForOrder);
                            if (view === "hours" && value.hour() < order.hour()) return true;
                            if (
                              view === "minutes" &&
                              value.hour() === order.hour() &&
                              value.minute() <= order.minute()
                            )
                              return true;
                          }
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
                          <p className="text-xs font-semibold text-red-500">
                            ⚠️{" "}
                            {!availableForOrder
                              ? "Chọn giờ mở đặt trước"
                              : errors.finalizationDeadline}
                          </p>
                        )}
                    </div>
                    <div
                      id="field-availableFrom"
                      className="flex flex-col gap-1.5"
                      onClick={() => setClickedFields((prev) => new Set(prev).add("start"))}
                    >
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarPlus className="w-3 h-3 text-green-600" />
                        Bắt đầu ca
                      </label>
                      <TimePicker
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        minutesStep={1}
                        value={availableFrom ? dayjs(availableFrom) : null}
                        onChange={(v) => handleTimeSelect("start", v)}
                        shouldDisableTime={(value, view) => {
                          if (finalizationDeadline) {
                            const dl = dayjs(finalizationDeadline);
                            if (view === "hours" && value.hour() < dl.hour()) return true;
                            if (
                              view === "minutes" &&
                              value.hour() === dl.hour() &&
                              value.minute() <= dl.minute()
                            )
                              return true;
                          }
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
                          <p className="text-xs font-semibold text-red-500">
                            ⚠️{" "}
                            {!finalizationDeadline
                              ? "Chọn hạn chốt món trước"
                              : errors.availableFrom}
                          </p>
                        )}
                    </div>
                    <div
                      id="field-availableTo"
                      className="flex flex-col gap-1.5"
                      onClick={() => setClickedFields((prev) => new Set(prev).add("end"))}
                    >
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-red-500" />
                        Kết thúc ca
                      </label>
                      <TimePicker
                        ampm={false}
                        timeSteps={{ minutes: 1 }}
                        minutesStep={1}
                        value={availableTo ? dayjs(availableTo) : null}
                        onChange={(v) => handleTimeSelect("end", v)}
                        shouldDisableTime={(value, view) => {
                          if (availableFrom) {
                            const start = dayjs(availableFrom);
                            if (view === "hours" && value.hour() < start.hour()) return true;
                            if (
                              view === "minutes" &&
                              value.hour() === start.hour() &&
                              value.minute() <= start.minute()
                            )
                              return true;
                          }
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
                        <p className="text-xs font-semibold text-red-500">
                          ⚠️ {!availableFrom ? "Chọn giờ bắt đầu ca trước" : errors.availableTo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Existing Sessions Schedule Preview for Selected Date */}
                  {sessionDate && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Các ca phục vụ trong ngày ({dayjs(sessionDate).format("DD/MM/YYYY")})
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {sessionsForSelectedDate.length} ca
                        </span>
                      </div>
                      {sessionsForSelectedDate.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Chưa có ca phục vụ nào trong ngày này.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {sessionsForSelectedDate.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-2 bg-white border border-slate-200 shadow-2xs px-3 py-1.5 rounded-xl text-xs"
                            >
                              <span className="font-extrabold text-slate-800">{s.name}:</span>
                              <span className="font-semibold text-slate-600">
                                {formatSessionRange(s.availableFrom, s.availableTo)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real-time Overlap Warning Card */}
                  {overlappingSessions.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 space-y-1.5 shadow-xs animate-shake mt-4">
                      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-700">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        Cảnh báo trùng thời gian ca phục vụ!
                      </div>
                      <p className="text-xs font-bold leading-relaxed">
                        {formatSessionOverlapMessage(
                          availableFrom,
                          availableTo,
                          overlappingSessions,
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </LocalizationProvider>

              {/* Policy Section */}
              <div className="bg-gray-50/50 border border-gray-200/30 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  ⚙️ Chính sách
                </h3>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Tự động chốt
                  </label>
                  <select
                    value={autoFinalizePolicy}
                    onChange={(e) => setAutoFinalizePolicy(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-200/60 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-700 transition-all shadow-xs cursor-pointer"
                  >
                    <option value={0}>Không tự động chốt</option>
                    <option value={1}>Tự động chốt khi hết hạn order</option>
                    <option value={2}>Tự động chốt khi hết ca ăn</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Template Limits Configuration */}
          <div
            id="field-templatesName"
            className={cn(
              "bg-white rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xs transition-colors duration-300",
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
                          className="font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm max-w-[10rem] focus:ring-1 focus:ring-[#D35400] shadow-xs"
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
                        const cat =
                          categoryMap[s.categoryId] ||
                          categories.find(
                            (c) => c.id?.toLowerCase() === s.categoryId?.toLowerCase(),
                          );
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
                                  disabled={s.isRequired}
                                  onChange={(e) =>
                                    updateTemplateSetting(
                                      tIdx,
                                      sIdx,
                                      "minQuantity",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-12 text-center border border-gray-200 rounded-lg p-1 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400] disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-bold">Max:</span>
                                <input
                                  type="number"
                                  min={s.isRequired ? 2 : s.minQuantity}
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
        <div className="lg:col-span-6 space-y-8 lg:sticky lg:top-0">
          {/* Mapped Session Dishes Pool (Drop zone) */}
          <div
            id="field-dishes"
            ref={dropZoneRef}
            onDragOver={handleDragOverDropZone}
            onDragLeave={() => setIsDragOverDropZone(false)}
            onDrop={handleDropToSelected}
            className={cn(
              "bg-white rounded-3xl border p-6 min-h-[16rem] transition-all duration-300 flex flex-col shadow-xs",
              isDragOverDropZone
                ? "bg-orange-50/40 border-dashed border-[#D35400] ring-2 ring-[#D35400]/10 scale-[1.01]"
                : errors.dishes
                  ? "border-red-400 bg-red-50/5"
                  : "border-gray-200",
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
                  "border text-xs font-black px-3 py-1 rounded-full shadow-xs transition-colors duration-300",
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
                      "selected-dish-item drag-item dish-pop-in flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#D35400]/15 shadow-xs hover:shadow-sm hover:border-[#D35400]/30 group transition-all cursor-grab active:cursor-grabbing",
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
              "bg-white rounded-3xl border p-6 min-h-[22rem] flex flex-col shadow-xs transition-all duration-300",
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
                        ? "bg-[#D35400] text-white shadow-xs"
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
                          ? "bg-[#D35400] text-white shadow-xs"
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
          className="px-6 py-3.5 border border-gray-200/50 hover:border-gray-300 text-gray-600 rounded-2xl text-base font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-xs"
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
