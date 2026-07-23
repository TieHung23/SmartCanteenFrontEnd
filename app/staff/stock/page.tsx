"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Coffee,
  Loader2,
  Check,
  X,
  Layers,
  Sparkles,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/lib/stores/use-search";
import { sessionService } from "@/services/session.service";
import { dishService } from "@/services/dish.service";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/services/session.service";
import type { Dish } from "@/types/dish.types";

interface CategoryInfo {
  id: string;
  name: string;
}

interface DishStock {
  id: string;
  name: string;
  categoryName: string;
  totalPrepared: number;
  remaining: number;
  imgUrl?: string | null;
  price?: number;
}

interface SessionStock {
  id: string;
  name: string;
  description: string;
  availableFrom: string;
  availableTo: string;
  dishes: DishStock[];
}

function formatTimeRange(from: string, to: string) {
  const fmt = (s: string) => {
    try {
      return new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return s;
    }
  };
  return `${fmt(from)} - ${fmt(to)}`;
}

function isSessionLive(session: { availableFrom?: string; availableTo?: string }) {
  if (!session.availableFrom || !session.availableTo) return false;
  try {
    const now = new Date().getTime();
    const from = new Date(session.availableFrom).getTime();
    const to = new Date(session.availableTo).getTime();
    return now >= from && now <= to;
  } catch {
    return false;
  }
}

export default function StockPage() {
  const [sessionStocks, setSessionStocks] = useState<SessionStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "ok">("all");

  const searchQuery = useGlobalSearch((s) => s.query);

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const categoriesRes = await apiClient
      .get<ApiResponse<CategoryInfo[]>>(API_ENDPOINTS.CATEGORY.LIST)
      .catch(() => null);
    const categoryMap = new Map<string, string>();
    if (categoriesRes) {
      const catData = (categoriesRes as unknown as ApiResponse<CategoryInfo[]>).value;
      if (Array.isArray(catData)) {
        catData.forEach((c) => categoryMap.set(c.id, c.name));
      }
    }

    const [sessionsRes, dishes] = await Promise.all([
      sessionService.getSessions({ pageSize: 50 }).catch(() => null),
      sessionService.getAllDishes().catch(() => [] as Dish[]),
    ]);

    if (sessionsRes?.items) {
      const stockList: SessionStock[] = sessionsRes.items.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        availableFrom: s.availableFrom,
        availableTo: s.availableTo,
        dishes: s.dishes.map((d) => {
          const dishInfo = dishes.find((di) => di.id === d.dishId);
          const catId = d.categoryId || dishInfo?.categoryId || "";
          const catName = dishInfo?.categoryName || categoryMap.get(catId) || catId || "Khác";
          return {
            id: d.dishId,
            name: d.dishName || dishInfo?.name || "Món ăn",
            categoryName: catName,
            totalPrepared: d.preparedQuantity ?? 0,
            remaining: d.preparedQuantity ?? 0,
            imgUrl: dishInfo?.imgUrl || d.imgUrl,
            price: dishInfo?.price ?? d.priceAmount,
          };
        }),
      }));
      setSessionStocks(stockList);
      if (stockList.length > 0) {
        setActiveSessionId((prev) => prev || stockList[0].id);
      }
    } else {
      setSessionStocks([]);
    }
    setLoading(false);
  }, []);

  const handleUpdateStock = async (dishId: string, customVal?: number) => {
    if (!dishId) return;
    const targetVal = customVal !== undefined ? customVal : editingStockVal;
    if (targetVal < 0) return;

    setSavingStock(true);
    try {
      await dishService.updateStock(dishId, targetVal);
      toast.success("Cập nhật tồn kho thành công!", {
        description: `Đã cập nhật số lượng thành ${targetVal} suất.`,
      });
      setEditingStockId(null);
      fetchData();
    } catch {
      toast.error("Không thể cập nhật số lượng tồn kho.");
    } finally {
      setSavingStock(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const activeSession = sessionStocks.find((s) => s.id === activeSessionId);

  const filteredDishes = (activeSession?.dishes || []).filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || d.name.toLowerCase().includes(q) || d.categoryName.toLowerCase().includes(q);
    const isLow = d.remaining <= 10;
    if (stockFilter === "low") return matchesSearch && isLow;
    if (stockFilter === "ok") return matchesSearch && !isLow;
    return matchesSearch;
  });

  const grouped = filteredDishes.reduce<Record<string, DishStock[]>>((acc, d) => {
    if (!acc[d.categoryName]) acc[d.categoryName] = [];
    acc[d.categoryName].push(d);
    return acc;
  }, {});

  const totalPrepared = activeSession?.dishes.reduce((s, d) => s + d.totalPrepared, 0) || 0;
  const totalRemaining = activeSession?.dishes.reduce((s, d) => s + d.remaining, 0) || 0;
  const lowStockItems = activeSession?.dishes.filter((d) => d.remaining <= 10).length || 0;
  const okStockItems = activeSession?.dishes.filter((d) => d.remaining > 10).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="w-11 h-11 rounded-2xl bg-[#FF4C24]/10 border border-[#FF4C24]/20 flex items-center justify-center text-[#FF4C24]">
              <Package className="w-6 h-6" />
            </div>
            Quản Lý Tồn Kho Thực Phẩm
          </h1>
          <p className="text-base text-gray-500 mt-1.5 font-medium">
            Giám sát số lượng khẩu phần đã chuẩn bị, lượng bán ra và cập nhật tồn kho tức thì
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-bold px-5 py-3 rounded-2xl transition shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Tải lại dữ liệu
        </button>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Đã Chuẩn Bị
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{totalPrepared}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">Khẩu phần tổng ca</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tồn Thực Tế
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{totalRemaining}</p>
          <p className="text-xs text-emerald-600/80 font-medium mt-1">Sẵn sàng phục vụ</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Cần Nhập Thêm
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-3">{lowStockItems}</p>
          <p className="text-xs text-rose-500 font-medium mt-1">Món tồn dưới 10 suất</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tổng Số Ca
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{sessionStocks.length}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">Ca ăn khả dụng hôm nay</p>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF4C24]" />
            <p className="text-sm font-bold text-gray-400">Đang đồng bộ kho thực phẩm...</p>
          </div>
        ) : (
          <>
            {/* SESSION SELECTOR TABS (GIỐNG TRANG PHIÊN ĂN, MÀU CAM VÀNG NỔI BẬT NĂNG ĐỘNG) */}
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Chọn Ca Ăn Phục Vụ
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 select-none scrollbar-none">
                {sessionStocks.map((session) => {
                  const isSelected = activeSessionId === session.id;
                  const isLive = isSessionLive(session);
                  return (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        "shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-base border-2 transition-all duration-300 cursor-pointer",
                        isSelected
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg shadow-orange-500/25 scale-102"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 border-gray-200 shadow-2xs",
                      )}
                    >
                      <Coffee
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isSelected ? "text-white" : "text-gray-400",
                        )}
                      />
                      <span className="whitespace-nowrap">{session.name}</span>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-bold transition-colors",
                          isSelected ? "bg-white/20 text-white" : "bg-gray-200/80 text-gray-600",
                        )}
                      >
                        {formatTimeRange(session.availableFrom, session.availableTo)}
                      </span>
                      {isLive && (
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse",
                            isSelected ? "bg-white" : "bg-green-500",
                          )}
                          title="Đang mở bán"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BAR LỌC & TÌM KIẾM */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setStockFilter("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer",
                    stockFilter === "all"
                      ? "bg-white text-gray-900 shadow-2xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  Tất cả ({activeSession?.dishes.length || 0})
                </button>
                <button
                  onClick={() => setStockFilter("low")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer",
                    stockFilter === "low"
                      ? "bg-rose-500 text-white shadow-2xs"
                      : "text-rose-600 hover:bg-rose-50",
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Sắp hết ({lowStockItems})
                </button>
                <button
                  onClick={() => setStockFilter("ok")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer",
                    stockFilter === "ok"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-emerald-600 hover:bg-emerald-50",
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Đủ hàng ({okStockItems})
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm món ăn, danh mục..."
                  value={searchQuery}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 focus:border-[#FF4C24] text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* DẠNG DANH SÁCH MÓN ĂN THEO PHÂN NHÓM */}
            {Object.keys(grouped).length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-gray-600">
                  {sessionStocks.length === 0
                    ? "Chưa có ca ăn nào khả dụng"
                    : "Không tìm thấy món ăn nào khớp bộ lọc"}
                </p>
                <p className="text-xs text-gray-400">
                  Thử tìm kiếm với từ khóa khác hoặc chuyển ca phục vụ
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([catName, dishes]) => {
                  return (
                    <div
                      key={catName}
                      className="border border-gray-200/80 rounded-3xl overflow-hidden shadow-2xs"
                    >
                      {/* CATEGORY HEADER */}
                      <div className="flex items-center justify-between px-6 py-3.5 bg-gray-50/90 border-b border-gray-200/80">
                        <div className="flex items-center gap-3">
                          <Filter className="w-4 h-4 text-[#FF4C24]" />
                          <span className="font-extrabold text-gray-900 text-base">{catName}</span>
                          <span className="text-xs text-gray-500 font-bold bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                            {dishes.length} món
                          </span>
                        </div>
                      </div>

                      {/* DISH ITEMS LIST */}
                      <div className="divide-y divide-gray-100 bg-white">
                        {dishes.map((dish) => {
                          const isLow = dish.remaining <= 10;
                          const ratio =
                            dish.totalPrepared > 0
                              ? Math.min(
                                  100,
                                  Math.round((dish.remaining / dish.totalPrepared) * 100),
                                )
                              : 0;

                          return (
                            <div
                              key={dish.id}
                              className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-gray-50/60 transition-colors group"
                            >
                              {/* DISH INFO WITH IMAGE */}
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/80 shrink-0 relative flex items-center justify-center">
                                  {dish.imgUrl ? (
                                    <Image
                                      src={dish.imgUrl}
                                      alt={dish.name}
                                      fill
                                      sizes="56px"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <span className="text-2xl">🍲</span>
                                  )}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <h4 className="font-extrabold text-gray-900 text-base truncate">
                                    {dish.name}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <span>{dish.categoryName}</span>
                                    {dish.price !== undefined && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[#FF4C24] font-extrabold flex items-center gap-1">
                                          <span>{dish.price.toLocaleString()}</span>
                                          <Image
                                            src="/logo_point.png"
                                            alt="point"
                                            width={14}
                                            height={14}
                                            className="object-contain inline-block"
                                          />
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* STOCK LEVEL & PROGRESS BAR */}
                              <div className="flex items-center gap-6 sm:w-72">
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-gray-400">
                                      Đã chuẩn bị:{" "}
                                      <strong className="text-gray-700">
                                        {dish.totalPrepared}
                                      </strong>
                                    </span>
                                    <span
                                      className={cn(isLow ? "text-rose-600" : "text-emerald-600")}
                                    >
                                      Tồn: {dish.remaining}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        isLow
                                          ? "bg-rose-500"
                                          : ratio < 30
                                            ? "bg-amber-500"
                                            : "bg-emerald-500",
                                      )}
                                      style={{ width: `${ratio}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS / INLINE EDIT CONTROLS */}
                              <div className="flex items-center gap-2 shrink-0">
                                {editingStockId === dish.id ? (
                                  <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
                                    <input
                                      type="number"
                                      min="0"
                                      autoFocus
                                      value={editingStockVal}
                                      onChange={(e) => setEditingStockVal(Number(e.target.value))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleUpdateStock(dish.id);
                                        if (e.key === "Escape") setEditingStockId(null);
                                      }}
                                      className="w-20 text-center text-sm font-extrabold text-gray-900 bg-white border border-gray-200 rounded-xl py-1.5 outline-none focus:ring-2 focus:ring-[#FF4C24]/30"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStock(dish.id)}
                                      disabled={savingStock}
                                      className="p-2 rounded-xl bg-[#FF4C24] hover:bg-[#e03e18] text-white flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                                      title="Lưu"
                                    >
                                      {savingStock ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingStockId(null)}
                                      className="p-2 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center font-bold cursor-pointer"
                                      title="Hủy"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStockId(dish.id);
                                        setEditingStockVal(dish.remaining);
                                      }}
                                      className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 hover:text-gray-900 transition flex items-center justify-center cursor-pointer shadow-3xs"
                                      title="Chỉnh sửa số lượng tồn kho"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {isLow && (
                                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Cần nhập
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
