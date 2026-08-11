"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  RotateCcw,
  Route,
  FileText,
  Package,
  Search,
  PlayCircle,
} from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import { dishService } from "@/services/dish.service";
import { orderService } from "@/services/order.service";
import { managerUserService } from "@/services/manager-user.service";
import { slotConfigurationService } from "@/services/slot-configuration.service";
import type { SessionDetail, SessionListItem } from "@/types/session.types";
import type { Category } from "@/types/category.types";
import type { Dish } from "@/types/dish.types";
import type { OrderListItem, OrderDetail } from "@/types/order.types";
import { cn } from "@/lib/utils";
import {
  checkSessionOverlap,
  extractApiErrorMessage,
  formatSessionOverlapMessage,
} from "@/lib/session-overlap";
import { AlertTriangle, ShoppingBag, Eye } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { SlotConfigTab } from "./slot-config-tab";
import Modal from "../../_components/modal";

interface LocalTemplate {
  id?: string;
  name: string;
  settings: { categoryId: string; minQuantity: number; maxQuantity: number; isRequired: boolean }[];
  dishIds: string[];
}

interface SessionDetailsContentProps {
  sessionId: string;
  onBack: () => void;
}

function distributeDishesToTemplates(
  mealTemplates: {
    id?: string;
    name: string;
    settings: {
      categoryId: string;
      minQuantity: number;
      maxQuantity: number;
      isRequired: boolean;
    }[];
  }[],
  allDishIds: string[],
  allDishes: Dish[],
): LocalTemplate[] {
  return mealTemplates.map((t) => {
    const catIds = new Set(t.settings.map((s) => s.categoryId));
    const matchingDishIds = allDishIds.filter((dishId) => {
      const dish = allDishes.find((d) => d.id === dishId);
      return dish && catIds.has(dish.categoryId);
    });
    return {
      id: t.id,
      name: t.name,
      settings: t.settings.map((s) => ({
        categoryId: s.categoryId,
        minQuantity: s.minQuantity,
        maxQuantity: s.maxQuantity,
        isRequired: s.isRequired,
      })),
      dishIds: matchingDishIds,
    };
  });
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

export function SessionDetailsContent({ sessionId, onBack }: SessionDetailsContentProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [existingSessions, setExistingSessions] = useState<SessionListItem[]>([]);
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
  const [editTemplates, setEditTemplates] = useState<LocalTemplate[]>([]);
  const [editEditingTplIdx, setEditEditingTplIdx] = useState(-1);
  const [editSelectedDishIds, setEditSelectedDishIds] = useState<Set<string>>(new Set());
  const [editDishSearch, setEditDishSearch] = useState("");
  const [editCategoryFilter, setEditCategoryFilter] = useState("all");
  const [editSelectedAddCat, setEditSelectedAddCat] = useState<Record<number, string>>({});
  const [editAutoFinalizePolicy, setEditAutoFinalizePolicy] = useState(0);

  const [preparedQuantities, setPreparedQuantities] = useState<Record<string, number>>({});
  // null = ordered quantities unavailable → fail open, no minimum enforced.
  const [orderedQuantities, setOrderedQuantities] = useState<Record<string, number> | null>(null);
  const [quantitiesError, setQuantitiesError] = useState(false);
  const [loadingQuantities, setLoadingQuantities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "config" | "orders">("info");

  const [sessionOrders, setSessionOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderDetail | null>(null);
  const [userMap, setUserMap] = useState<
    Record<string, { name: string; email: string; studentId: string | null }>
  >({});

  const fetchSessionOrders = useCallback(async () => {
    if (!sessionId) return;
    setLoadingOrders(true);
    try {
      const [res, usersRes] = await Promise.all([
        orderService.getManagerOrdersBySession(sessionId, { pageSize: 100 }),
        managerUserService.getUsers({ pageSize: 200 }).catch(() => null),
      ]);
      if (usersRes?.items) {
        const uMap: Record<string, { name: string; email: string; studentId: string | null }> = {};
        usersRes.items.forEach((u) => {
          uMap[u.id] = {
            name: u.name || u.email || `Khách hàng (${u.id.slice(0, 8)})`,
            email: u.email || "",
            studentId: u.studentId || null,
          };
        });
        setUserMap(uMap);
      }
      setSessionOrders(res.items || []);
    } catch (err) {
      console.error("Failed to load session orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessionOrders();
  }, [fetchSessionOrders]);

  useEffect(() => {
    if (activeTab === "orders") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSessionOrders();
    }
  }, [activeTab, fetchSessionOrders]);

  const loadSession = useCallback(async () => {
    try {
      const [sessionData, catResult, dishResult, sessionResult, quantitiesData] = await Promise.all(
        [
          sessionService.getSessionDetail(sessionId),
          categoryService.getAll().catch(() => ({ items: [] as Category[] })),
          dishService
            .getDishes({ isActive: true, pageSize: 200 })
            .catch(() => ({ items: [] as Dish[] })),
          sessionService
            .getSessions({ pageSize: 1000 })
            .catch(() => ({ items: [] as SessionListItem[] })),
          sessionService.getSessionDishQuantities(sessionId).catch(() => null),
        ],
      );
      setSession(sessionData);
      setCategories(catResult.items);
      setAllDishes(dishResult.items);
      setExistingSessions(sessionResult.items || []);

      const qtyMap: Record<string, number> | null = quantitiesData
        ? Object.fromEntries(quantitiesData.dishes.map((d) => [d.dishId, d.orderedQuantity]))
        : null;
      setOrderedQuantities(qtyMap);
      setQuantitiesError(qtyMap === null);

      // Seed each input at or above the ordered quantity so the form starts valid.
      const initialQs: Record<string, number> = {};
      (sessionData.dishes || []).forEach((d) => {
        const saved = d.preparedQuantity ?? 0;
        initialQs[d.dishId] = sessionData.isFinalized
          ? saved
          : Math.max(saved, qtyMap?.[d.dishId] ?? 0);
      });
      setPreparedQuantities(initialQs);

      setEditName(sessionData.name);
      setEditDescription(sessionData.description);
      setEditAvailableFrom(toDatetimeLocal(sessionData.availableFrom));
      setEditAvailableTo(toDatetimeLocal(sessionData.availableTo));
      setEditAvailableForOrder(toDatetimeLocal(sessionData.availableForOrder));
      setEditDeadline(toDatetimeLocal(sessionData.finalizationDeadline));
      setEditAutoFinalizePolicy(sessionData.autoFinalizePolicy ?? 0);

      const allDishIds = sessionData.dishes.map((d) => d.dishId);
      const loadedTemplates: LocalTemplate[] =
        sessionData.mealTemplates && sessionData.mealTemplates.length > 0
          ? distributeDishesToTemplates(sessionData.mealTemplates, allDishIds, dishResult.items)
          : [{ name: "Suất chuẩn", settings: [], dishIds: allDishIds }];
      setEditTemplates(loadedTemplates);
      setEditEditingTplIdx(-1);
      setEditSelectedDishIds(new Set());
      setEditDishSearch("");
      setEditCategoryFilter("all");
      setEditSelectedAddCat({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết ca ăn.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Re-fetches only the ordered quantities after a failed load. Deliberately does not
   * re-prefill the inputs — validation flags anything too low without clobbering typed values.
   */
  const retryLoadQuantities = useCallback(async () => {
    setLoadingQuantities(true);
    try {
      const data = await sessionService.getSessionDishQuantities(sessionId);
      setOrderedQuantities(
        Object.fromEntries(data.dishes.map((d) => [d.dishId, d.orderedQuantity])),
      );
      setQuantitiesError(false);
    } catch {
      setQuantitiesError(true);
      toast.error("Vẫn không tải được số lượng đã đặt.");
    } finally {
      setLoadingQuantities(false);
    }
  }, [sessionId]);

  const editOverlappingSessions = useMemo(
    () => checkSessionOverlap(editAvailableFrom, editAvailableTo, existingSessions, sessionId),
    [editAvailableFrom, editAvailableTo, existingSessions, sessionId],
  );

  const shortfalls = useMemo(() => {
    if (!session || !orderedQuantities || session.isFinalized) return [];
    return (session.dishes || [])
      .map((d) => ({
        dishId: d.dishId,
        dishName: d.dishName || d.dishId.slice(0, 8),
        prepared: preparedQuantities[d.dishId] ?? 0,
        ordered: orderedQuantities[d.dishId] ?? 0,
      }))
      .filter((r) => r.prepared < r.ordered);
  }, [session, orderedQuantities, preparedQuantities]);

  const hasShortfall = shortfalls.length > 0;

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

    const allDishIds = session.dishes.map((d) => d.dishId);
    const loadedTemplates: LocalTemplate[] =
      session.mealTemplates && session.mealTemplates.length > 0
        ? distributeDishesToTemplates(session.mealTemplates, allDishIds, allDishes)
        : [{ name: "Suất chuẩn", settings: [], dishIds: allDishIds }];
    setEditTemplates(loadedTemplates);
    setEditEditingTplIdx(-1);
    setEditSelectedDishIds(new Set());
    setEditDishSearch("");
    setEditCategoryFilter("all");
    setEditSelectedAddCat({});
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
    if (editTemplates.length === 0) {
      toast.error("Vui lòng có ít nhất một khuôn mẫu.");
      return;
    }
    const totalDishIds = new Set(editTemplates.flatMap((t) => t.dishIds));
    if (totalDishIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một món ăn.");
      return;
    }

    setIsSaving(true);

    const payload = {
      id: session.id,
      name: editName.trim(),
      description: editDescription.trim(),
      isActive: session.isActive,
      availableFrom: new Date(editAvailableFrom).toISOString(),
      availableTo: new Date(editAvailableTo).toISOString(),
      availableForOrder: new Date(editAvailableForOrder).toISOString(),
      ...(editDeadline ? { finalizationDeadline: new Date(editDeadline).toISOString() } : {}),
      autoFinalizePolicy: editAutoFinalizePolicy,
      mealTemplates: editTemplates
        .filter((t) => t.name.trim())
        .map((t) => ({
          name: t.name.trim(),
          settings: t.settings,
        })),
      dishes: Array.from(totalDishIds).map((dishId) => ({ dishId })),
    };

    if (editOverlappingSessions.length > 0) {
      const overlapMsg = formatSessionOverlapMessage(
        editAvailableFrom,
        editAvailableTo,
        editOverlappingSessions,
      );
      toast.error(overlapMsg);
      setIsSaving(false);
      return;
    }

    // Compute dishes removed from session to clean up orphaned slot-configs
    const oldDishIds = session.dishes.map((d) => d.dishId);
    const removedDishIds = oldDishIds.filter((id) => !totalDishIds.has(id));

    try {
      console.log("[Session Update] Payload:", JSON.stringify(payload, null, 2));
      const result = await sessionService.updateSession(session.id, payload);
      console.log("[Session Update] Response:", result);

      // Clean up orphaned slot-configurations for removed dishes
      if (removedDishIds.length > 0) {
        try {
          const configs = await slotConfigurationService.getBySession(sessionId);
          const orphanedConfigs = configs.filter((c) => removedDishIds.includes(c.dishId));
          if (orphanedConfigs.length > 0) {
            await Promise.all(
              orphanedConfigs.map((c) => slotConfigurationService.delete(c.id).catch(() => {})),
            );
          }
        } catch {
          // Non-blocking: log cleanup failure silently
        }
      }

      toast.success("Cập nhật ca phục vụ thành công!");
      setIsEditing(false);
      await loadSession();
    } catch (err) {
      console.error("[Session Update] Error:", err);
      const apiMsg = extractApiErrorMessage(err, "");
      let msg = apiMsg;
      if (!msg) {
        const conflicts = checkSessionOverlap(
          editAvailableFrom,
          editAvailableTo,
          existingSessions,
          sessionId,
        );
        if (conflicts.length > 0) {
          msg = formatSessionOverlapMessage(editAvailableFrom, editAvailableTo, conflicts);
        } else {
          msg = "Cập nhật ca phục vụ thất bại. Vui lòng thử lại.";
        }
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuantityChange = (dishId: string, val: string) => {
    if (val === "") {
      setPreparedQuantities((prev) => ({ ...prev, [dishId]: "" as unknown as number }));
      return;
    }
    const cleaned = val.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setPreparedQuantities((prev) => ({
      ...prev,
      [dishId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleFinalize = async () => {
    if (!session) return;
    if (hasShortfall) {
      toast.error("Số lượng chuẩn bị không được thấp hơn số lượng đã đặt.");
      return;
    }

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
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, "Lỗi khi thực hiện chốt đơn ca phục vụ."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeNow = async () => {
    if (!session) return;
    if (hasShortfall) {
      toast.error("Số lượng chuẩn bị không được thấp hơn số lượng đã đặt.");
      return;
    }

    const result = await Swal.fire({
      title: "Bắt đầu ca & Phục vụ ngay?",
      text: "Bạn có chắc chắn muốn chốt ca và BẮT ĐẦU PHỤC VỤ NGAY LẬP TỨC? Thời gian bắt đầu ca ăn sẽ được đẩy về thời điểm hiện tại để Robot có thể đi gắp món ngay.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Bắt đầu ca ngay",
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

      await sessionService.finalizeSessionNow(session.id, preparedDishes);
      toast.success("Đã chốt ca và kích hoạt phục vụ ngay thành công! Robot sẵn sàng gắp món.");
      await loadSession();
    } catch (err: unknown) {
      const rawMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Lỗi khi thực hiện bắt đầu ca phục vụ.");

      let friendlyMsg = rawMsg;
      if (rawMsg.includes("would overlap with another session")) {
        friendlyMsg = "Khung giờ ca ăn này khi bắt đầu ngay sẽ bị đè/trùng lặp với một ca ăn khác!";
      } else if (rawMsg.includes("already ended")) {
        friendlyMsg = "Thời gian ca ăn đã kết thúc trong quá khứ, không thể bắt đầu phục vụ ngay.";
      } else if (rawMsg.includes("deadline has passed")) {
        friendlyMsg = "Hạn chốt món ăn của ca này đã trôi qua.";
      } else if (rawMsg.includes("already finalized")) {
        friendlyMsg = "Ca phục vụ này đã được chốt từ trước.";
      }

      Swal.fire({
        title: "Không thể bắt đầu ca ngay!",
        text: friendlyMsg,
        icon: "error",
        confirmButtonColor: "#D35400",
        confirmButtonText: "Đã hiểu",
        customClass: {
          popup: "rounded-3xl border border-gray-200 shadow-md",
          title: "text-lg font-bold text-gray-900",
        },
      });
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEditTemplate = () => {
    setEditTemplates((prev) => [...prev, { name: "", settings: [], dishIds: [] }]);
  };

  const removeEditTemplate = (idx: number) => {
    setEditTemplates((prev) => prev.filter((_, i) => i !== idx));
    if (editEditingTplIdx === idx) {
      setEditEditingTplIdx(-1);
      setEditSelectedDishIds(new Set());
    } else if (editEditingTplIdx > idx) {
      setEditEditingTplIdx((prev) => prev - 1);
    }
  };

  const updateEditTemplateName = (idx: number, val: string) => {
    setEditTemplates((prev) => prev.map((t, i) => (i === idx ? { ...t, name: val } : t)));
  };

  const updateEditTemplateSetting = (
    tIdx: number,
    sIdx: number,
    field: "minQuantity" | "maxQuantity" | "isRequired",
    value: number | boolean,
  ) => {
    setEditTemplates((prev) =>
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
  };

  const removeEditTemplateSetting = (tIdx: number, sIdx: number) => {
    setEditTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx ? { ...t, settings: t.settings.filter((_, j) => j !== sIdx) } : t,
      ),
    );
  };

  const addEditCategoryToTemplate = (tIdx: number, catId: string) => {
    if (!catId) return;
    const categoryDishIds = allDishes.filter((d) => d.categoryId === catId).map((d) => d.id);
    setEditTemplates((prev) =>
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
  };

  const finalizeEditTemplate = (tIdx: number) => {
    setEditTemplates((prev) =>
      prev.map((t, i) => (i === tIdx ? { ...t, dishIds: [...editSelectedDishIds] } : t)),
    );
    setEditSelectedDishIds(new Set());
    setEditEditingTplIdx(-1);
  };

  const editTemplateDishes = (tIdx: number) => {
    const t = editTemplates[tIdx];
    if (!t) return;
    setEditSelectedDishIds(new Set(t.dishIds));
    setEditEditingTplIdx(tIdx);
  };

  const toggleEditDishSelection = (dishId: string) => {
    setEditSelectedDishIds((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  };

  const editAllSelectedDishIds = useMemo(
    () =>
      new Set([
        ...editSelectedDishIds,
        ...editTemplates.flatMap((t, i) => (i === editEditingTplIdx ? [] : t.dishIds)),
      ]),
    [editSelectedDishIds, editTemplates, editEditingTplIdx],
  );

  const editFilteredDishes = useMemo(
    () =>
      allDishes.filter(
        (d) =>
          (d.name.toLowerCase().includes(editDishSearch.toLowerCase()) ||
            d.categoryName?.toLowerCase().includes(editDishSearch.toLowerCase())) &&
          (editCategoryFilter === "all" || d.categoryId === editCategoryFilter),
      ),
    [allDishes, editDishSearch, editCategoryFilter],
  );

  const editDishCategories = useMemo(() => {
    const cats = new Map<string, string>();
    allDishes.forEach((d) => {
      if (d.categoryId && d.categoryName) cats.set(d.categoryId, d.categoryName);
    });
    return Array.from(cats.entries());
  }, [allDishes]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

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
        {error || "Không tìm thấy ca ăn."}
      </div>
    );
  }

  if (!session) return null;

  const isActive = session.isActive;
  const canEdit = !session.isFinalized && new Date(session.availableForOrder) > new Date();

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
            {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </span>
          {session.isFinalized && (
            <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Đã chốt
            </span>
          )}
          {!isEditing && canEdit && (
            <button
              onClick={enterEditMode}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D35400] hover:bg-[#b04600] text-white text-sm font-black rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-wider ml-auto"
            >
              <Pencil className="w-4 h-4" />
              Chỉnh sửa
            </button>
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

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60">
        <button
          onClick={() => setActiveTab("info")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all",
            activeTab === "info"
              ? "bg-white text-[#D35400] shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          <FileText className="w-4 h-4" />
          Thông tin ca
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all",
            activeTab === "config"
              ? "bg-white text-[#D35400] shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          <Route className="w-4 h-4" />
          Cấu hình robot & Hardware
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all",
            activeTab === "orders"
              ? "bg-[#D35400] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          Chi tiết đơn đặt ({sessionOrders.length})
        </button>
      </div>

      {/* Tab Content: Info — View Mode */}
      {activeTab === "info" && !isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center border-b border-gray-100 pb-3">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                  Thời gian ca trực
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Mở đặt
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableForOrder)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Thời gian bắt đầu
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableFrom)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Thời gian kết thúc
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {formatDate(session.availableTo)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Hạn chốt món
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {session.finalizationDeadline
                        ? formatDate(session.finalizationDeadline)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <Layers className="w-4 h-4 text-[#D35400]" />
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                  Định mức khuôn mẫu
                </h2>
              </div>
              <div className="space-y-4 max-h-[16rem] overflow-y-auto pr-1">
                {session.mealTemplates?.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3"
                  >
                    <p className="text-sm font-black text-gray-800">{template.name}</p>
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
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <UtensilsCrossed className="w-4 h-4 text-[#D35400]" />
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                  Món ăn phục vụ ({session.dishes?.length ?? 0})
                </h2>
              </div>
              <div className="flex flex-col gap-2 max-h-[35rem] overflow-y-auto pr-1">
                {session.dishes?.map((d) => {
                  const minQty = orderedQuantities?.[d.dishId] ?? 0;
                  const isShort =
                    !session.isFinalized &&
                    orderedQuantities !== null &&
                    (preparedQuantities[d.dishId] ?? 0) < minQty;
                  return (
                    <div
                      key={d.id}
                      className={cn(
                        "bg-white rounded-xl border transition-all flex items-center gap-3 px-3 py-2.5",
                        isShort
                          ? "border-red-300 bg-red-50/40"
                          : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/30",
                      )}
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
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-2">
                            {orderedQuantities !== null && (
                              <span
                                className={cn(
                                  "text-[10px] font-black px-2 py-1 rounded-md border whitespace-nowrap",
                                  isShort
                                    ? "text-red-700 bg-red-50 border-red-200"
                                    : "text-gray-500 bg-gray-100 border-gray-200",
                                )}
                                title="Số suất khách đã đặt — không được chuẩn bị ít hơn"
                              >
                                Đã đặt: {minQty}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-gray-400">CB:</span>
                            <input
                              type="number"
                              min={orderedQuantities !== null ? minQty : 0}
                              value={
                                preparedQuantities[d.dishId] === undefined ||
                                preparedQuantities[d.dishId] === null
                                  ? 0
                                  : preparedQuantities[d.dishId]
                              }
                              onChange={(e) => handleQuantityChange(d.dishId, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              onBlur={() => {
                                if (
                                  preparedQuantities[d.dishId] === ("" as unknown as number) ||
                                  isNaN(Number(preparedQuantities[d.dishId]))
                                ) {
                                  setPreparedQuantities((prev) => ({ ...prev, [d.dishId]: 0 }));
                                }
                              }}
                              disabled={isSubmitting}
                              className={cn(
                                "w-16 px-2 py-1.5 text-center border rounded-lg outline-none text-sm font-bold shadow-xs transition-colors",
                                isShort
                                  ? "border-red-300 text-red-700 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                  : "border-gray-200 hover:border-orange-300 focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400]",
                              )}
                            />
                          </div>
                          {isShort && (
                            <span className="text-[10px] text-red-600 font-bold">
                              Tối thiểu {minQty}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!session.isFinalized && (
                <div className="mt-6 space-y-3">
                  {hasShortfall && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-extrabold text-red-800">
                          {shortfalls.length} món đang thấp hơn số lượng đã đặt
                        </p>
                        <p className="text-xs text-red-700 font-semibold mt-0.5 leading-relaxed">
                          Không thể chốt ca cho tới khi số lượng chuẩn bị của tất cả các món đạt mức
                          tối thiểu:{" "}
                          <span className="font-bold">
                            {shortfalls
                              .map((s) => `${s.dishName} (${s.prepared}/${s.ordered})`)
                              .join(", ")}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
                  {quantitiesError && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                          Không tải được số lượng đã đặt — tạm thời không kiểm tra tối thiểu.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={retryLoadQuantities}
                        disabled={loadingQuantities}
                        className="px-3 py-1.5 text-xs font-black text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                      >
                        {loadingQuantities ? "Đang tải..." : "Thử lại"}
                      </button>
                    </div>
                  )}
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-extrabold text-gray-800">
                          Chốt số lượng chuẩn bị nấu & Bắt đầu phục vụ
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5 leading-relaxed">
                          Nhập số lượng thực tế. Bạn có thể chọn{" "}
                          <span className="text-emerald-700 font-bold">&quot;Bắt đầu ca&quot;</span>{" "}
                          để Robot đi gắp món ngay lập tức, hoặc{" "}
                          <span className="text-[#D35400] font-bold">
                            &quot;Chốt đơn ca ăn&quot;
                          </span>{" "}
                          theo lịch trình chuẩn.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={handleFinalizeNow}
                        disabled={isSubmitting || hasShortfall}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all shadow-xs shrink-0 uppercase tracking-wider active:scale-95 flex items-center gap-2 cursor-pointer"
                        title={
                          hasShortfall
                            ? "Số lượng chuẩn bị đang thấp hơn số lượng đã đặt"
                            : "Chốt số lượng và kích hoạt ca phục vụ ngay lập tức cho Robot gắp món"
                        }
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            <span>Bắt đầu ca</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleFinalize}
                        disabled={isSubmitting || hasShortfall}
                        className="px-5 py-3 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all shadow-xs shrink-0 uppercase tracking-wider active:scale-95 cursor-pointer"
                        title={
                          hasShortfall
                            ? "Số lượng chuẩn bị đang thấp hơn số lượng đã đặt"
                            : "Chốt số lượng chuẩn bị theo lịch ban đầu"
                        }
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Chốt đơn ca ăn"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Info — Edit Mode (2-column like create form) */}
      {activeTab === "info" && isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Time + Templates */}
          <div className="space-y-6">
            {/* Time Settings */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D35400]" /> Thiết lập thời gian
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Mở đặt
                  </label>
                  <input
                    type="datetime-local"
                    value={editAvailableForOrder}
                    onChange={(e) => setEditAvailableForOrder(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={editAvailableFrom}
                    onChange={(e) => setEditAvailableFrom(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={editAvailableTo}
                    onChange={(e) => setEditAvailableTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Hạn chốt món
                  </label>
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Tự động chốt
                  </label>
                  <select
                    value={editAutoFinalizePolicy}
                    onChange={(e) => setEditAutoFinalizePolicy(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all shadow-xs cursor-pointer"
                  >
                    <option value={0}>Không tự động chốt</option>
                    <option value={1}>Tự động chốt khi hết hạn order</option>
                    <option value={2}>Tự động chốt khi hết ca ăn</option>
                  </select>
                </div>

                {editOverlappingSessions.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 space-y-1.5 shadow-xs animate-shake mt-3">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      Cảnh báo trùng thời gian ca phục vụ!
                    </div>
                    <p className="text-xs font-bold leading-relaxed">
                      {formatSessionOverlapMessage(
                        editAvailableFrom,
                        editAvailableTo,
                        editOverlappingSessions,
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#D35400]" /> Khuôn mẫu ({editTemplates.length})
                </h2>
                <button
                  type="button"
                  onClick={addEditTemplate}
                  className="px-4 py-2 bg-[#D35400]/10 hover:bg-[#D35400]/20 text-[#D35400] text-xs font-black uppercase tracking-wider rounded-xl transition-colors border border-[#D35400]/10"
                >
                  + Thêm mẫu
                </button>
              </div>
              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                {editTemplates.map((template, tIdx) => (
                  <div
                    key={tIdx}
                    className={cn(
                      "bg-gray-50/70 border rounded-2xl p-4 space-y-3 transition-all",
                      editEditingTplIdx === tIdx
                        ? "border-[#D35400]/40 bg-[#D35400]/5 shadow-sm"
                        : "border-gray-200/25",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          value={template.name}
                          onChange={(e) => updateEditTemplateName(tIdx, e.target.value)}
                          placeholder="Tên khuôn mẫu"
                          className="flex-1 min-w-0 font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#D35400] shadow-xs"
                        />
                        {template.dishIds.length > 0 && (
                          <span className="text-[10px] font-black text-[#D35400] bg-orange-50 border border-orange-200/50 px-2.5 py-1 rounded-full shrink-0">
                            {template.dishIds.length} món
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {template.dishIds.length > 0 && editEditingTplIdx !== tIdx ? (
                          <button
                            type="button"
                            onClick={() => editTemplateDishes(tIdx)}
                            className="px-3 py-1.5 text-[10px] font-black text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg uppercase tracking-wider transition-colors"
                          >
                            Sửa món
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => finalizeEditTemplate(tIdx)}
                            disabled={editSelectedDishIds.size === 0 && editEditingTplIdx !== tIdx}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-40 hover:bg-green-700 transition-all active:scale-90"
                          >
                            Xong
                          </button>
                        )}
                        {editTemplates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditTemplate(tIdx)}
                            className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {template.settings.map((s, sIdx) => {
                        const cat = categoryMap[s.categoryId];
                        return (
                          <div
                            key={sIdx}
                            className="bg-white rounded-xl border border-gray-200/25 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-bold text-gray-800 truncate min-w-0">
                              {cat?.name || s.categoryId.slice(0, 8)}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-gray-400 font-bold">Min:</span>
                              <input
                                type="number"
                                min={0}
                                max={s.maxQuantity}
                                value={s.minQuantity}
                                disabled={s.isRequired}
                                onChange={(e) =>
                                  updateEditTemplateSetting(
                                    tIdx,
                                    sIdx,
                                    "minQuantity",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-10 text-center border border-gray-200 rounded-lg p-0.5 text-[11px] font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400] disabled:opacity-50"
                              />
                              <span className="text-[10px] text-gray-400 font-bold">Max:</span>
                              <input
                                type="number"
                                min={s.isRequired ? 2 : s.minQuantity}
                                value={s.maxQuantity}
                                onChange={(e) =>
                                  updateEditTemplateSetting(
                                    tIdx,
                                    sIdx,
                                    "maxQuantity",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-10 text-center border border-gray-200 rounded-lg p-0.5 text-[11px] font-bold text-gray-800 focus:ring-1 focus:ring-[#D35400]"
                              />
                              <input
                                type="checkbox"
                                checked={s.isRequired}
                                onChange={(e) =>
                                  updateEditTemplateSetting(
                                    tIdx,
                                    sIdx,
                                    "isRequired",
                                    e.target.checked,
                                  )
                                }
                                className="w-3 h-3 accent-[#D35400]"
                              />
                              <button
                                onClick={() => removeEditTemplateSetting(tIdx, sIdx)}
                                className="w-5 h-5 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={editSelectedAddCat[tIdx] || ""}
                        onChange={(e) =>
                          setEditSelectedAddCat((prev) => ({ ...prev, [tIdx]: e.target.value }))
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 bg-white focus:ring-1 focus:ring-[#D35400] outline-none"
                      >
                        <option value="">+ Thêm danh mục</option>
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
                          addEditCategoryToTemplate(tIdx, editSelectedAddCat[tIdx]);
                          setEditSelectedAddCat((prev) => ({ ...prev, [tIdx]: "" }));
                        }}
                        disabled={!editSelectedAddCat[tIdx]}
                        className="px-3 py-2 bg-[#D35400] text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-[#a84300] transition-all active:scale-90"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Dish Assignment */}
          <div className="space-y-6 lg:sticky lg:top-0">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-[#D35400]" />
                  {editEditingTplIdx >= 0 ? "Chọn món ăn" : "Tổng quan món"}
                </h2>
                <span className="border text-xs font-black px-3 py-1 rounded-full bg-orange-50 border-orange-100/50 text-[#D35400]">
                  {editAllSelectedDishIds.size} món
                </span>
              </div>

              {editEditingTplIdx >= 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500">
                      Đang sửa:{" "}
                      <span className="text-[#D35400]">
                        {editTemplates[editEditingTplIdx]?.name || `Mẫu ${editEditingTplIdx + 1}`}
                      </span>{" "}
                      · {editSelectedDishIds.size} món
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => finalizeEditTemplate(editEditingTplIdx)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-90"
                      >
                        Xong ({editSelectedDishIds.size})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditEditingTplIdx(-1);
                          setEditSelectedDishIds(new Set());
                        }}
                        className="text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="Tìm kiếm món ăn..."
                      value={editDishSearch}
                      onChange={(e) => setEditDishSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#D35400] text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
                    <button
                      type="button"
                      onClick={() => setEditCategoryFilter("all")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                        editCategoryFilter === "all"
                          ? "bg-[#D35400] text-white shadow-xs"
                          : "bg-gray-100 text-gray-500 hover:text-gray-800",
                      )}
                    >
                      Tất cả
                    </button>
                    {editDishCategories.map(([catId, catName]) => (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => setEditCategoryFilter(catId)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                          editCategoryFilter === catId
                            ? "bg-[#D35400] text-white shadow-xs"
                            : "bg-gray-100 text-gray-500 hover:text-gray-800",
                        )}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[28rem] overflow-y-auto pr-1">
                    {editFilteredDishes.length === 0 ? (
                      <p className="text-gray-400 text-xs font-bold text-center py-10">
                        Không tìm thấy món ăn nào.
                      </p>
                    ) : (
                      editFilteredDishes.map((dish) => {
                        const selected = editSelectedDishIds.has(dish.id);
                        return (
                          <div
                            key={dish.id}
                            onClick={() => toggleEditDishSelection(dish.id)}
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
                              <p className="text-sm font-bold text-gray-800 truncate">
                                {dish.name}
                              </p>
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
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {editTemplates.map((template, tIdx) => (
                    <div
                      key={tIdx}
                      className="bg-gray-50/70 border border-gray-200/25 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {template.name || `Mẫu ${tIdx + 1}`}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {template.dishIds.length} món · {template.settings.length} danh mục
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => editTemplateDishes(tIdx)}
                        className="px-3 py-1.5 bg-[#D35400]/10 hover:bg-[#D35400]/20 text-[#D35400] rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
                      >
                        Chọn món
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-200 rounded-2xl">
                    <Package className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400">
                      Chọn &quot;Chọn món&quot; trên một khuôn mẫu để bắt đầu gán món ăn
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Config */}
      {activeTab === "config" && (
        <SlotConfigTab sessionId={sessionId} dishes={session.dishes || []} />
      )}

      {/* Tab Content: Orders */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D35400]" />
                Danh sách đơn hàng trong ca ({sessionOrders.length})
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Theo dõi tất cả đơn hàng đã được người dùng đặt trong ca phục vụ này.
              </p>
            </div>

            {/* Filter pills & search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Tìm mã đơn, tên khách..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-[#D35400]"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#D35400]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="0">Chờ xử lý (0)</option>
                <option value="1">Đang nấu / Chuẩn bị (1)</option>
                <option value="2">Đã hoàn thành (2)</option>
                <option value="3">Đã hủy (3)</option>
              </select>
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex h-48 items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#D35400]/20 border-t-[#D35400] rounded-full animate-spin" />
            </div>
          ) : sessionOrders.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-400">
                Chưa có đơn hàng nào được tạo trong ca phục vụ này.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Mã đơn hàng
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Khách hàng
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Thời gian đặt
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Tổng tiền
                    </th>
                    <th className="px-5 py-3.5 text-xs font-black uppercase text-gray-400">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-black uppercase text-gray-400">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionOrders
                    .filter((ord) => {
                      if (
                        orderStatusFilter !== "all" &&
                        ord.status !== parseInt(orderStatusFilter, 10)
                      ) {
                        return false;
                      }
                      const uInfo = userMap[ord.userId];
                      if (orderSearch.trim()) {
                        const q = orderSearch.toLowerCase();
                        const matchId = (ord.id || "").toLowerCase().includes(q);
                        const matchUserId = (ord.userId || "").toLowerCase().includes(q);
                        const matchName = (uInfo?.name || "").toLowerCase().includes(q);
                        const matchEmail = (uInfo?.email || "").toLowerCase().includes(q);
                        return matchId || matchUserId || matchName || matchEmail;
                      }
                      return true;
                    })
                    .map((ord) => {
                      const uInfo = userMap[ord.userId];
                      const custName = uInfo?.name || `Khách hàng (${ord.userId.slice(0, 8)})`;
                      const custEmail = uInfo?.email || ord.userId;
                      return (
                        <tr key={ord.id} className="hover:bg-orange-50/20">
                          <td className="px-5 py-4 font-mono font-bold text-sm text-[#D35400]">
                            #{ord.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-gray-900">{custName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{custEmail}</p>
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-gray-600">
                            {ord.createdAtUtc ? formatDate(ord.createdAtUtc) : "—"}
                          </td>
                          <td className="px-5 py-4 text-sm font-black text-gray-900">
                            {(ord.totalPrice || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                                ord.status === 2
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ord.status === 3
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800",
                              )}
                            >
                              {ord.status === 2
                                ? "Hoàn thành"
                                : ord.status === 3
                                  ? "Đã hủy"
                                  : "Đang xử lý"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const detail = await orderService.getManagerOrderById(ord.id);
                                  setSelectedOrderForModal(detail);
                                } catch {
                                  toast.error("Không thể tải chi tiết đơn hàng.");
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-[#D35400] text-gray-700 hover:text-white rounded-xl text-xs font-bold transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem chi tiết
                            </button>
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

      {/* Order Detail Modal */}
      {selectedOrderForModal && (
        <Modal
          isOpen={!!selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
          title={`Chi tiết đơn hàng #${selectedOrderForModal.id.slice(0, 8).toUpperCase()}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs font-bold text-gray-700">
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Khách hàng</p>
                <p className="text-gray-900 text-sm font-black mt-0.5">
                  {userMap[selectedOrderForModal.userId]?.name ||
                    `Khách hàng (${selectedOrderForModal.userId.slice(0, 8)})`}
                </p>
                <p className="text-gray-500 font-mono text-[11px]">
                  {userMap[selectedOrderForModal.userId]?.email || selectedOrderForModal.userId}
                </p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px]">Tổng thanh toán</p>
                <p className="text-[#D35400] text-sm font-black mt-0.5">
                  {(selectedOrderForModal.totalPrice || 0).toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-400">Danh sách món ăn</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {selectedOrderForModal.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white text-xs">
                    <span className="font-bold text-gray-900">{item.dishName}</span>
                    <span className="font-black text-gray-600">
                      x{item.quantity} (
                      {((item.unitPrice || 0) * item.quantity).toLocaleString("vi-VN")} đ)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

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
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Quay lại danh sách
          </button>
        )}
      </div>
    </div>
  );
}
