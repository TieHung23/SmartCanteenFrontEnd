"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Coffee,
  Layers,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/lib/stores/use-search";
import { sessionService } from "@/services/session.service";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "@/services/session.service";

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

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("vi-VN");
  } catch {
    return s;
  }
}

export default function StockPage() {
  const [sessionStocks, setSessionStocks] = useState<SessionStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState("");
  const searchQuery = useGlobalSearch((s) => s.query);
  const setSearchQuery = useGlobalSearch((s) => s.setQuery);

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
      sessionService.getAllDishes(),
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
            name: d.dishName || dishInfo?.name || "Không xác định",
            categoryName: catName,
            totalPrepared: d.preparedQuantity ?? 0,
            remaining: d.preparedQuantity ?? 0,
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const activeSession = sessionStocks.find((s) => s.id === activeSessionId);

  const filteredDishes = (activeSession?.dishes || []).filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || d.name.toLowerCase().includes(q) || d.categoryName.toLowerCase().includes(q);
  });

  const grouped = filteredDishes.reduce<Record<string, DishStock[]>>((acc, d) => {
    if (!acc[d.categoryName]) acc[d.categoryName] = [];
    acc[d.categoryName].push(d);
    return acc;
  }, {});

  const totalPrepared = activeSession?.dishes.reduce((s, d) => s + d.totalPrepared, 0) || 0;
  const totalRemaining = activeSession?.dishes.reduce((s, d) => s + d.remaining, 0) || 0;
  const lowStockItems = activeSession?.dishes.filter((d) => d.remaining <= 10).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="border-b border-gray-200 pb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
              <Package className="w-9 h-9 text-[#FF4C24]" />
              Quản Lý Tồn Kho
            </h1>
            <p className="text-lg text-gray-500 mt-1.5">
              Theo dõi số lượng món ăn đã chuẩn bị, đã đặt và còn lại theo ca
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold px-5 py-3 rounded-xl transition shadow-xs"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          {
            label: "Đã chuẩn bị",
            value: totalPrepared,
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Còn tồn",
            value: totalRemaining,
            icon: Package,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Sắp hết",
            value: lowStockItems,
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Số ca",
            value: sessionStocks.length,
            icon: Coffee,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm"
          >
            <div
              className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}
            >
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
            <div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-base font-medium text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF4C24]" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {sessionStocks.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-xl text-base font-bold transition-all shrink-0 border",
                    activeSessionId === s.id
                      ? "bg-[#FF4C24] text-white border-[#FF4C24] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <Coffee className="w-5 h-5" />
                  {s.name}
                  <span className="text-sm opacity-70">
                    ({formatTimeRange(s.availableFrom, s.availableTo)})
                  </span>
                </button>
              ))}
            </div>

            <div className="sm:ml-auto relative w-full sm:w-80 mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 font-medium"
              />
            </div>

            {activeSession && (
              <div className="text-base text-gray-500 mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5" />
                Ca {activeSession.name} · {formatDate(activeSession.availableFrom)} ·{" "}
                {formatTimeRange(activeSession.availableFrom, activeSession.availableTo)}
                <span className="text-gray-300">|</span>
                <span className="font-semibold">{activeSession.dishes.length} món</span>
              </div>
            )}

            {Object.keys(grouped).length === 0 ? (
              <div className="py-20 text-center text-base text-gray-400 font-semibold">
                {sessionStocks.length === 0 ? "Không có ca ăn nào" : "Không tìm thấy món ăn nào"}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([catName, dishes]) => {
                  const catLowStock = dishes.filter((d) => d.remaining <= 10).length;
                  return (
                    <div
                      key={catName}
                      className="border border-gray-200 rounded-2xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                          <Filter className="w-5 h-5 text-gray-500" />
                          <span className="font-extrabold text-gray-800 text-lg">{catName}</span>
                          <span className="text-sm text-gray-400 font-semibold bg-white px-3 py-1 rounded-full border">
                            {dishes.length} món
                          </span>
                          {catLowStock > 0 && (
                            <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                              {catLowStock} sắp hết
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {dishes.map((dish) => {
                          const threshold = 10;
                          const isLow = dish.totalPrepared > 0 && dish.remaining <= threshold;
                          return (
                            <div
                              key={dish.id}
                              className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-gray-50/50 transition"
                            >
                              <div className="flex items-center gap-5 min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0",
                                    isLow
                                      ? "bg-rose-100 text-rose-600"
                                      : "bg-emerald-100 text-emerald-600",
                                  )}
                                >
                                  <Package className="w-7 h-7" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-gray-900 text-lg">
                                    {dish.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {dish.categoryName}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 sm:gap-8 text-center sm:text-left">
                                <div>
                                  <p className="text-sm font-semibold text-gray-400">Đã chuẩn bị</p>
                                  <p className="font-extrabold text-gray-800 text-xl">
                                    {dish.totalPrepared}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-400">Còn lại</p>
                                  <p
                                    className={cn(
                                      "font-extrabold text-2xl",
                                      isLow ? "text-rose-600" : "text-emerald-600",
                                    )}
                                  >
                                    {dish.remaining}
                                  </p>
                                </div>
                              </div>

                              {isLow && (
                                <div className="flex items-center gap-2 text-sm font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 shrink-0">
                                  <AlertTriangle className="w-4 h-4" />
                                  Sắp hết
                                </div>
                              )}
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
