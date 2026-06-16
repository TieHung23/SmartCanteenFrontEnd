"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  AlertTriangle,
  Coffee,
  Tag,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutGrid,
  Clock,
  Calendar,
} from "lucide-react";
import { mealService } from "@/services/meal.service";
import { categoryService } from "@/services/category.service";
import { toast } from "sonner";

interface MealItem {
  id?: string;
  Id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  availableFrom?: string;
  availableTo?: string;
  mealTemplates?: TemplateItem[];
  dishes?: MealDishItem[];
}

interface TemplateItem {
  id?: string;
  name?: string;
  settings?: TemplateSetting[];
}

interface TemplateSetting {
  categoryId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

interface CategoryItem {
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  imgUrl?: string;
  ImgUrl?: string;
}

interface DishInfo {
  id?: string;
  Id?: string;
  name?: string;
  price?: number;
  imgUrl?: string;
  ImgUrl?: string;
  categoryId?: string;
  CategoryId?: string;
}

interface MealDishItem {
  dishId?: string;
  quantity?: number;
}

export default function StaffSessionsPage() {
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, CategoryItem>>({});
  const [dishesMap, setDishesMap] = useState<Record<string, DishInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // ── REFS ĐIỀU KHIỂN CUỘN TỰ ĐỘNG VÀ KÉO RÊ ──
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isHoveredOrDragging = useRef(false);
  const scrollDirection = useRef(1); // 1: Tiến sang phải, -1: Lùi sang trái

  // State hỗ trợ kéo rê bằng chuột (Drag to scroll)
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        let categoriesList = [];
        try {
          const categoryData = await categoryService.getAll({ pageSize: 100 });
          categoriesList = categoryData?.items || [];
        } catch (catErr) {
          console.warn("Không thể tải danh mục:", catErr);
        }

        const cateMap: Record<string, CategoryItem> = (categoriesList || []).reduce(
          (acc: Record<string, CategoryItem>, c: CategoryItem) => {
            const idClean = (c.id || c.Id || "").toString().toLowerCase();
            return { ...acc, [idClean]: c };
          },
          {},
        );
        setCategoriesMap(cateMap);

        let dishesList = [];
        try {
          dishesList = await mealService.getAllDishes();
        } catch (dishErr) {
          console.warn("Không thể tải món ăn:", dishErr);
        }

        const dishMap: Record<string, DishInfo> = (dishesList || []).reduce(
          (acc: Record<string, DishInfo>, d: DishInfo) => {
            const idClean = (d.id || d.Id || "").toString().toLowerCase();
            return { ...acc, [idClean]: d };
          },
          {},
        );
        setDishesMap(dishMap);

        const mealData = await mealService.getMeals({ pageSize: 100 });
        const activeMeals = mealData?.items || [];
        setMeals(activeMeals);

        if (activeMeals.length > 0) {
          const firstMealId = activeMeals[0].id || activeMeals[0].Id;
          setActiveMealId(firstMealId);

          const initialOpenState: Record<string, boolean> = {};
          (activeMeals[0].mealTemplates || []).forEach((template: TemplateItem) => {
            (template.settings || []).forEach((s: TemplateSetting) => {
              initialOpenState[s.categoryId.toLowerCase()] = true;
            });
          });
          setOpenCategories(initialOpenState);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo dữ liệu:", err);
        toast.error("Mạng kết nối máy chủ không ổn định. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // ── CƠ CHẾ SỬA LỖI TỰ ĐỘNG CHẠY TUYỆT ĐỐI (DÙNG ANIMATION FRAME + ĐỘ TRỄ) ──
  useEffect(() => {
    if (loading || meals.length === 0) return;

    // Hàm thực hiện vòng lặp cuộn tịnh tiến
    const initAutoScroll = () => {
      const container = tabsContainerRef.current;
      if (!container) return;

      const scrollSpeed = 0.5; // Tốc độ trượt êm ái vừa phải

      const scrollLoop = () => {
        if (!isHoveredOrDragging.current && container) {
          const maxScrollLeft = container.scrollWidth - container.clientWidth;

          // Nếu dải Tab quá ngắn (không có thanh cuộn) thì không cần chạy hiệu ứng
          if (maxScrollLeft <= 0) return;

          // Kiểm tra chạm biên phải -> Đổi hướng sang trái
          if (container.scrollLeft >= maxScrollLeft - 1 && scrollDirection.current === 1) {
            scrollDirection.current = -1;
          }
          // Kiểm tra chạm biên trái -> Đổi hướng sang phải
          else if (container.scrollLeft <= 0 && scrollDirection.current === -1) {
            scrollDirection.current = 1;
          }

          // Cộng dồn vị trí tịnh tiến dựa trên hướng hiện tại
          container.scrollLeft += scrollSpeed * scrollDirection.current;
        }
        animationRef.current = requestAnimationFrame(scrollLoop);
      };

      animationRef.current = requestAnimationFrame(scrollLoop);
    };

    // Chờ 300ms sau khi đóng loading để DOM ổn định cấu trúc rồi mới kích hoạt
    const timerId = setTimeout(initAutoScroll, 300);

    return () => {
      clearTimeout(timerId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, meals]);

  // Điều khiển trạng thái tạm hoãn khi tương tác trực tiếp
  const handleMouseEnter = () => {
    isHoveredOrDragging.current = true;
  };

  const handleMouseLeave = () => {
    if (!isDown.current) {
      isHoveredOrDragging.current = false;
    }
  };

  // ── CƠ CHẾ NHẤN GIỮ ĐỂ KÉO CHUỘT (DRAG TO SCROLL) NHANH ──
  const handleMouseDownTabs = (e: React.MouseEvent) => {
    const container = tabsContainerRef.current;
    if (!container) return;

    isDown.current = true;
    isHoveredOrDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeftState.current = container.scrollLeft;
  };

  const handleMouseMoveTabs = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();

    const container = tabsContainerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.8; // Gia tốc kéo mượt, nhanh
    container.scrollLeft = scrollLeftState.current - walk;
  };

  const handleMouseUpTabs = () => {
    isDown.current = false;
    isHoveredOrDragging.current = false; // Trả lại quyền cuộn tự động
  };

  // ── ĐỊNH DẠNG TIME / DATE ──
  const formatTime = (dateStr: string) => {
    try {
      if (!dateStr) return "--:--";
      const date = new Date(dateStr);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "--/--/----";
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "--/--/----";
    }
  };

  const toggleCategory = (cateId: string) => {
    setOpenCategories((prev) => ({ ...prev, [cateId]: !prev[cateId] }));
  };

  const isValidImageUrl = (url: string | null | undefined) => {
    if (!url) return false;
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl !== "" && cleanUrl !== "string" && !cleanUrl.includes(" ");
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-12 w-12 animate-spin text-[#FF4C24]" />
        <p className="text-base font-bold text-gray-500">
          Đang khởi chạy băng chuyền ca trực tự động...
        </p>
      </div>
    );
  }

  const currentSelectedMeal = meals.find((m) => (m.id || m.Id) === activeMealId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Tiêu đề */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Điều Phối Phiên Ăn & Tồn Kho
        </h1>
        <p className="text-base text-gray-500 mt-2">
          Băng chuyền danh sách ca ăn tự động chuyển động liên tục, hỗ trợ nhấn giữ kéo rê nhanh.
        </p>
      </div>

      {meals.length === 0 ? (
        <div className="bg-white border-2 border-gray-100 rounded-2xl py-20 text-center text-gray-500 font-bold shadow-sm">
          Không tìm thấy phiên phục vụ nào hoạt động hôm nay.
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── TẦNG 1: HỆ THỐNG TABS TỰ CHẠY BẤT TẬN (ẨN TRƯỢT, CHO KÉO CHUỘT) ── */}
          <div
            ref={tabsContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDownTabs}
            onMouseMove={handleMouseMoveTabs}
            onMouseUp={handleMouseUpTabs}
            className="flex gap-4 overflow-x-auto pb-3 border-b-2 border-gray-100 select-none active:cursor-grabbing cursor-grab"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {meals.map((meal) => {
              const mId = meal.id || meal.Id;
              const isSelected = mId === activeMealId;
              return (
                <button
                  key={mId}
                  onClick={() => {
                    // Chỉ cho kích hoạt sự kiện click chọn nếu người dùng không phải đang kéo rê chuột
                    if (!isDown.current) {
                      setActiveMealId(mId);
                    }
                  }}
                  className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-base border-2 transition-all duration-300 ${
                    isSelected
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg scale-102"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 border-gray-200 shadow-2xs"
                  }`}
                >
                  <Coffee
                    className={`w-5 h-5 ${isSelected ? "text-[#FF4C24]" : "text-gray-400"}`}
                  />
                  <span className="whitespace-nowrap">{meal.name}</span>
                  {meal.isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TẦNG 2: NỘI DUNG CHI TIẾT CỦA CA ĂN ĐANG CHỌN ── */}
          {currentSelectedMeal && (
            <div className="space-y-6 animate-fade-in">
              {/* 🕒 BOX THỜI GIAN MỞ / ĐÓNG CA ĂN */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border-2 border-orange-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-xs">
                <div className="flex items-center gap-4 border-r border-orange-200/60 pr-4 last:border-none">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-orange-100 text-[#FF4C24] shadow-2xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                      Thời gian phục vụ ca
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">
                      {formatTime(currentSelectedMeal.availableFrom)} —{" "}
                      {formatTime(currentSelectedMeal.availableTo)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-r border-orange-200/60 pr-4 last:border-none">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-orange-100 text-amber-600 shadow-2xs">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                      Ngày hoạt động
                    </p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">
                      {formatDate(currentSelectedMeal.availableFrom)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start md:justify-end">
                  <span
                    className={`inline-flex text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${
                      currentSelectedMeal.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-200 text-gray-500 border-gray-300"
                    }`}
                  >
                    {currentSelectedMeal.isActive ? "● Đang Mở Bán" : "○ Ca Đã Khóa"}
                  </span>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div className="text-base text-gray-600 font-medium px-2">
                📝{" "}
                <span className="italic">
                  {currentSelectedMeal.description || "Chưa có mô tả cho phiên làm việc này."}
                </span>
              </div>

              {/* Cấu trúc Accordion */}
              {(currentSelectedMeal.mealTemplates || []).map((template: TemplateItem) => (
                <div key={template.id} className="space-y-4">
                  <div className="text-sm font-black text-gray-400 flex items-center gap-2 px-1 uppercase tracking-wider">
                    <LayoutGrid className="w-4 h-4" /> Định dạng khuôn mẫu: {template.name}
                  </div>

                  <div className="space-y-4">
                    {(template.settings || []).map((setting: TemplateSetting, sIdx: number) => {
                      const targetCateId = (setting.categoryId || "").toString().toLowerCase();
                      const dbCategory = categoriesMap[targetCateId];
                      const isExpanded = !!openCategories[targetCateId];

                      const targetCateName =
                        dbCategory?.name ||
                        dbCategory?.Name ||
                        `Danh mục (#${targetCateId.slice(0, 6).toUpperCase()})`;
                      const targetCateImg = dbCategory?.imgUrl || dbCategory?.ImgUrl;

                      const categoryDishes = (currentSelectedMeal.dishes || []).filter(
                        (d: MealDishItem) => {
                          const globalDishInfo =
                            dishesMap[(d.dishId || "").toString().toLowerCase()];
                          return (
                            globalDishInfo &&
                            (globalDishInfo.categoryId || globalDishInfo.CategoryId || "")
                              .toString()
                              .toLowerCase() === targetCateId
                          );
                        },
                      );

                      return (
                        <div
                          key={sIdx}
                          className="bg-white border-2 border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 transition-colors"
                        >
                          <div
                            onClick={() => toggleCategory(targetCateId)}
                            className="p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors select-none"
                          >
                            <div className="flex items-center gap-5 min-w-0">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border-2 border-white shrink-0 shadow-sm">
                                {isValidImageUrl(targetCateImg) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={targetCateImg}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-white">
                                    <Tag className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <h4 className="font-black text-lg text-gray-900 uppercase tracking-wide truncate">
                                  {targetCateName}
                                </h4>
                                <p className="text-sm text-gray-400 font-bold">
                                  Định mức yêu cầu: {setting.minQuantity} - {setting.maxQuantity}{" "}
                                  món ăn · Hiện có{" "}
                                  <span className="text-[#FF4C24]">{categoryDishes.length}</span>{" "}
                                  món mở bán
                                </p>
                              </div>
                            </div>
                            <div className="text-gray-400 pl-4">
                              {isExpanded ? (
                                <ChevronUp className="w-6 h-6 text-gray-700" />
                              ) : (
                                <ChevronDown className="w-6 h-6 text-gray-700" />
                              )}
                            </div>
                          </div>

                          {/* PHẦN HIỂN THỊ MÓN ĂN KHI BUNG RA */}
                          {isExpanded && (
                            <div className="border-t-2 border-gray-100 bg-gray-50/40 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                              {categoryDishes.length === 0 ? (
                                <p className="text-base text-gray-400 italic py-4 pl-1 col-span-2">
                                  Không có món ăn nào trong nhóm này được phân phối ca phục vụ.
                                </p>
                              ) : (
                                categoryDishes.map((d: MealDishItem, dIdx: number) => {
                                  const dishIdClean = (d.dishId || "").toString().toLowerCase();
                                  const dishInfo = dishesMap[dishIdClean];
                                  const stock = d.quantity;
                                  const dishImg = dishInfo?.imgUrl || dishInfo?.ImgUrl;

                                  return (
                                    <div
                                      key={dIdx}
                                      className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs hover:border-orange-200 transition-all"
                                    >
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border shrink-0 shadow-3xs">
                                          {isValidImageUrl(dishImg) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={dishImg}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                              <Layers className="w-5 h-5" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                          <p className="text-base font-black text-gray-800 truncate">
                                            {dishInfo?.name || "Món ăn ẩn"}
                                          </p>
                                          <p className="text-sm text-gray-500 font-bold">
                                            {(dishInfo?.price || 0).toLocaleString()} Point
                                          </p>
                                        </div>
                                      </div>

                                      <span
                                        className={`text-sm font-black px-4 py-2 rounded-xl border shrink-0 flex items-center gap-1.5 ${
                                          stock <= 10
                                            ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                                            : "bg-green-50 text-green-700 border-green-200"
                                        }`}
                                      >
                                        {stock <= 10 && (
                                          <AlertTriangle className="w-4 h-4 text-red-500" />
                                        )}
                                        Còn {stock} suất
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Style ẩn thanh trượt cục bộ */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
