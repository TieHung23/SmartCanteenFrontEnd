"use client";

import { useState } from "react";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Coffee,
  ChevronDown,
  ChevronUp,
  Layers,
  Utensils,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGlobalSearch } from "@/lib/stores/use-search";

interface DishStock {
  id: string;
  name: string;
  imgUrl: string;
  categoryName: string;
  totalPrepared: number;
  reserved: number;
  pickedUp: number;
  remaining: number;
  lowStockThreshold: number;
}

interface SessionStock {
  id: string;
  name: string;
  date: string;
  timeRange: string;
  dishes: DishStock[];
}

const MOCK_SESSIONS: SessionStock[] = [
  {
    id: "meal-001",
    name: "Sáng",
    date: "16/06/2026",
    timeRange: "06:00 - 08:30",
    dishes: [
      {
        id: "d1",
        name: "Bánh mì ốp la",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 50,
        reserved: 42,
        pickedUp: 38,
        remaining: 8,
        lowStockThreshold: 10,
      },
      {
        id: "d2",
        name: "Phở bò tái",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 40,
        reserved: 35,
        pickedUp: 30,
        remaining: 5,
        lowStockThreshold: 10,
      },
      {
        id: "d3",
        name: "Xôi gà",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 30,
        reserved: 20,
        pickedUp: 18,
        remaining: 10,
        lowStockThreshold: 10,
      },
      {
        id: "d4",
        name: "Sữa đậu nành",
        imgUrl: "",
        categoryName: "Đồ uống",
        totalPrepared: 60,
        reserved: 45,
        pickedUp: 40,
        remaining: 15,
        lowStockThreshold: 10,
      },
      {
        id: "d5",
        name: "Trà đá",
        imgUrl: "",
        categoryName: "Đồ uống",
        totalPrepared: 80,
        reserved: 55,
        pickedUp: 50,
        remaining: 25,
        lowStockThreshold: 20,
      },
      {
        id: "d6",
        name: "Bánh ngọt",
        imgUrl: "",
        categoryName: "Phụ",
        totalPrepared: 25,
        reserved: 18,
        pickedUp: 15,
        remaining: 7,
        lowStockThreshold: 10,
      },
    ],
  },
  {
    id: "meal-002",
    name: "Trưa",
    date: "16/06/2026",
    timeRange: "11:00 - 13:30",
    dishes: [
      {
        id: "d7",
        name: "Cơm sườn nướng",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 80,
        reserved: 65,
        pickedUp: 40,
        remaining: 15,
        lowStockThreshold: 15,
      },
      {
        id: "d8",
        name: "Cá ba sa kho tộ",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 60,
        reserved: 50,
        pickedUp: 30,
        remaining: 10,
        lowStockThreshold: 10,
      },
      {
        id: "d9",
        name: "Ức gà áp chảo",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 55,
        reserved: 48,
        pickedUp: 25,
        remaining: 7,
        lowStockThreshold: 10,
      },
      {
        id: "d10",
        name: "Canh rau củ",
        imgUrl: "",
        categoryName: "Món phụ",
        totalPrepared: 70,
        reserved: 60,
        pickedUp: 35,
        remaining: 10,
        lowStockThreshold: 10,
      },
      {
        id: "d11",
        name: "Salad trộn",
        imgUrl: "",
        categoryName: "Món phụ",
        totalPrepared: 45,
        reserved: 38,
        pickedUp: 20,
        remaining: 7,
        lowStockThreshold: 10,
      },
      {
        id: "d12",
        name: "Cơm trắng",
        imgUrl: "",
        categoryName: "Món phụ",
        totalPrepared: 100,
        reserved: 80,
        pickedUp: 45,
        remaining: 20,
        lowStockThreshold: 20,
      },
      {
        id: "d13",
        name: "Nước ngọt",
        imgUrl: "",
        categoryName: "Đồ uống",
        totalPrepared: 90,
        reserved: 70,
        pickedUp: 40,
        remaining: 20,
        lowStockThreshold: 15,
      },
      {
        id: "d14",
        name: "Trà đá",
        imgUrl: "",
        categoryName: "Đồ uống",
        totalPrepared: 120,
        reserved: 85,
        pickedUp: 50,
        remaining: 35,
        lowStockThreshold: 20,
      },
    ],
  },
  {
    id: "meal-003",
    name: "Chiều",
    date: "16/06/2026",
    timeRange: "15:00 - 17:30",
    dishes: [
      {
        id: "d15",
        name: "Bún bò Huế",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 45,
        reserved: 30,
        pickedUp: 10,
        remaining: 15,
        lowStockThreshold: 10,
      },
      {
        id: "d16",
        name: "Mì xào bò",
        imgUrl: "",
        categoryName: "Món chính",
        totalPrepared: 40,
        reserved: 25,
        pickedUp: 8,
        remaining: 15,
        lowStockThreshold: 10,
      },
      {
        id: "d17",
        name: "Chả giò",
        imgUrl: "",
        categoryName: "Món phụ",
        totalPrepared: 60,
        reserved: 35,
        pickedUp: 12,
        remaining: 25,
        lowStockThreshold: 15,
      },
      {
        id: "d18",
        name: "Rau muống luộc",
        imgUrl: "",
        categoryName: "Món phụ",
        totalPrepared: 50,
        reserved: 28,
        pickedUp: 10,
        remaining: 22,
        lowStockThreshold: 15,
      },
    ],
  },
];

export default function StockPage() {
  const [sessions] = useState<SessionStock[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || "");
  const searchQuery = useGlobalSearch((s) => s.query);
  const setSearchQuery = useGlobalSearch((s) => s.setQuery);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  const activeSession = sessions.find((s) => s.id === activeSessionId);

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
  const totalReserved = activeSession?.dishes.reduce((s, d) => s + d.reserved, 0) || 0;
  const totalRemaining = activeSession?.dishes.reduce((s, d) => s + d.remaining, 0) || 0;
  const lowStockItems =
    activeSession?.dishes.filter((d) => d.remaining <= d.lowStockThreshold).length || 0;

  const toggleCat = (cat: string) => setCollapsedCats((prev) => ({ ...prev, [cat]: !prev[cat] }));

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
          onClick={() => toast.success("Dữ liệu kho đã được làm mới")}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold px-5 py-3 rounded-xl transition shadow-xs"
        >
          <RefreshCw className="w-5 h-5" />
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
            label: "Đã đặt trước",
            value: totalReserved,
            icon: Utensils,
            color: "text-amber-600",
            bg: "bg-amber-50",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {sessions.map((s) => (
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
                <span className="text-sm opacity-70">({s.timeRange})</span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4C24]/20 text-gray-900 font-medium"
            />
          </div>
        </div>

        {activeSession && (
          <div className="text-base text-gray-500 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5" />
            Ca {activeSession.name} · {activeSession.date} · {activeSession.timeRange}
            <span className="text-gray-300">|</span>
            <span className="font-semibold">{activeSession.dishes.length} món</span>
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="py-20 text-center text-base text-gray-400 font-semibold">
            Không tìm thấy món ăn nào
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([catName, dishes]) => {
              const isCollapsed = !!collapsedCats[catName];
              const catLowStock = dishes.filter((d) => d.remaining <= d.lowStockThreshold).length;
              return (
                <div key={catName} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleCat(catName)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100/80 transition border-b border-gray-200"
                  >
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
                    {isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      {dishes.map((dish) => {
                        const isLow = dish.remaining <= dish.lowStockThreshold;
                        const progress =
                          dish.totalPrepared > 0
                            ? ((dish.totalPrepared - dish.remaining) / dish.totalPrepared) * 100
                            : 0;
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
                                <p className="text-sm text-gray-500 mt-0.5">{dish.categoryName}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 sm:gap-8 text-center sm:text-left">
                              <div>
                                <p className="text-sm font-semibold text-gray-400">Đã chuẩn bị</p>
                                <p className="font-extrabold text-gray-800 text-xl">
                                  {dish.totalPrepared}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-400">Đã đặt</p>
                                <p className="font-extrabold text-amber-600 text-xl">
                                  {dish.reserved}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-400">Đã nhận</p>
                                <p className="font-extrabold text-blue-600 text-xl">
                                  {dish.pickedUp}
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

                            <div className="w-full sm:w-40">
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-gray-400 font-semibold">Tiêu thụ</span>
                                <span
                                  className={cn(
                                    "font-bold",
                                    isLow ? "text-rose-600" : "text-gray-600",
                                  )}
                                >
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isLow ? "bg-rose-500" : "bg-emerald-500",
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
