"use client";

import React, { useState, useEffect, useRef, useMemo, startTransition } from "react";
import Image from "next/image";
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
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useGlobalSearch } from "@/lib/stores/use-search";

interface SessionItem {
  id?: string;
  Id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  availableFrom?: string;
  availableTo?: string;
  mealTemplates?: TemplateItem[];
  dishes?: SessionDishItem[];
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

interface SessionDishItem {
  id?: string;
  dishId?: string;
  dishName?: string;
  imgUrl?: string;
  priceAmount?: number;
  quantity?: number;
  preparedQuantity?: number | null;
}

export default function StaffSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, CategoryItem>>({});
  const [dishesMap, setDishesMap] = useState<Record<string, DishInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [preparedQuantities, setPreparedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        let categoriesList: CategoryItem[] = [];
        try {
          const categoryData = await categoryService.getAll({ pageSize: 100 });
          categoriesList = (categoryData?.items || []) as unknown as CategoryItem[];
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

        let dishesList: DishInfo[] = [];
        try {
          dishesList = (await sessionService.getAllDishes()) as unknown as DishInfo[];
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

        const sessionData = await sessionService.getSessions({ pageSize: 100 });
        const activeSessions = sessionData?.items || [];
        setSessions(activeSessions as SessionItem[]);

        if (activeSessions.length > 0) {
          const firstSessionId = activeSessions[0].id;
          setActiveSessionId(firstSessionId);

          const initialOpenState: Record<string, boolean> = {};
          const firstSessionTemplates = (activeSessions[0] as SessionItem).mealTemplates || [];
          firstSessionTemplates.forEach((template: TemplateItem) => {
            (template.settings || []).forEach((s: TemplateSetting) => {
              if (s.categoryId) initialOpenState[s.categoryId.toLowerCase()] = true;
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
    if (loading || sessions.length === 0) return;

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
  }, [loading, sessions]);

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

  const activeSessionRef = useRef<string | undefined>(undefined);

  // ── KHỞI TẠO SỐ LƯỢNG CHUẨN BỊ KHI ĐỔI CA ĂN ──
  useEffect(() => {
    if (!activeSessionId) return;
    if (activeSessionRef.current === activeSessionId) return;
    activeSessionRef.current = activeSessionId;
    const session = sessions.find((m) => m.id === activeSessionId);
    if (!session?.dishes) return;
    const initialQs: Record<string, number> = {};
    session.dishes.forEach((d) => {
      initialQs[d.dishId ?? ""] = d.preparedQuantity ?? 0;
    });
    startTransition(() => {
      setPreparedQuantities(initialQs);
    });
  }, [activeSessionId, sessions]);

  const handleQuantityChange = (dishId: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    setPreparedQuantities((prev) => ({
      ...prev,
      [dishId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleFinalize = async () => {
    if (!activeSessionId) return;
    const session = sessions.find((m) => m.id === activeSessionId);
    if (!session) return;

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
        popup: "rounded-3xl border border-gray-150 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const preparedDishes = (session.dishes || []).map((d) => ({
        dishId: d.dishId ?? "",
        preparedQuantity: preparedQuantities[d.dishId ?? ""] ?? 0,
      }));

      await sessionService.finalizeSession(activeSessionId, preparedDishes);
      toast.success("Chốt số lượng món ăn phục vụ thành công!");

      // Refresh sessions
      const sessionData = await sessionService.getSessions({ pageSize: 100 });
      setSessions((sessionData?.items || []) as SessionItem[]);
    } catch {
      toast.error("Lỗi khi thực hiện chốt đơn ca phục vụ.");
    } finally {
      setIsSubmitting(false);
    }
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

  const isSessionLive = (session: SessionItem) =>
    !!session.isActive && (!session.availableTo || new Date(session.availableTo) > new Date());

  const globalQuery = useGlobalSearch((s) => s.query);

  const filteredSessions = useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return sessions;
    return sessions.filter((m) => {
      const name = (m.name || "").toLowerCase();
      const desc = (m.description || "").toLowerCase();
      const dishesText = (m.dishes || [])
        .map((d: SessionDishItem) => {
          const dishId = (d.dishId || "").toLowerCase();
          const dishInfo = dishesMap[dishId];
          return (dishInfo?.name || "").toLowerCase();
        })
        .join(" ");
      const categoriesText = (m.mealTemplates || [])
        .flatMap((t: TemplateItem) =>
          (t.settings || []).map((s: TemplateSetting) => {
            const cateId = (s.categoryId || "").toLowerCase();
            const cate = categoriesMap[cateId];
            return (cate?.name || cate?.Name || "").toLowerCase();
          }),
        )
        .join(" ");
      return (
        name.includes(q) || desc.includes(q) || dishesText.includes(q) || categoriesText.includes(q)
      );
    });
  }, [sessions, globalQuery, categoriesMap, dishesMap]);

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

  const currentSelectedSession = sessions.find((m) => m.id === activeSessionId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* Tiêu đề */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900">Điều Phối Phiên Ăn</h1>
        <p className="text-lg text-gray-500 mt-1.5">
          Danh sách ca ăn, khuôn mẫu, danh mục và theo dõi tồn kho
        </p>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="bg-white border-2 border-gray-100 rounded-2xl py-20 text-center text-gray-500 font-bold shadow-sm">
          {globalQuery.trim()
            ? "Không tìm thấy phiên phục vụ nào khớp"
            : "Không tìm thấy phiên phục vụ nào hoạt động hôm nay."}
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
            {filteredSessions.map((session) => {
              const sId = session.id;
              const isSelected = sId === activeSessionId;
              return (
                <button
                  key={sId}
                  onClick={() => {
                    // Chỉ cho kích hoạt sự kiện click chọn nếu người dùng không phải đang kéo rê chuột
                    if (!isDown.current) {
                      if (sId) setActiveSessionId(sId);
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
                  <span className="whitespace-nowrap">{session.name}</span>
                  {isSessionLive(session) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TẦNG 2: NỘI DUNG CHI TIẾT CỦA CA ĂN ĐANG CHỌN ── */}
          {currentSelectedSession && (
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
                      {formatTime(currentSelectedSession.availableFrom || "")} —{" "}
                      {formatTime(currentSelectedSession.availableTo || "")}
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
                      {formatDate(currentSelectedSession.availableFrom || "")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start md:justify-end">
                  <span
                    className={`inline-flex text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${
                      isSessionLive(currentSelectedSession)
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-200 text-gray-500 border-gray-300"
                    }`}
                  >
                    {isSessionLive(currentSelectedSession) ? "● Đang Mở Bán" : "○ Ca Đã Khóa"}
                  </span>
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div className="text-base text-gray-600 font-medium px-2">
                📝{" "}
                <span className="italic">
                  {currentSelectedSession.description || "Chưa có mô tả cho phiên làm việc này."}
                </span>
              </div>

              {/* Cấu trúc Accordion */}
              {(currentSelectedSession.mealTemplates || []).map((template: TemplateItem) => (
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

                      const categoryDishes = (currentSelectedSession.dishes || []).filter(
                        (d: SessionDishItem) => {
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
                                categoryDishes.map((d: SessionDishItem, dIdx: number) => {
                                  const dishIdClean = (d.dishId || "").toString().toLowerCase();
                                  const dishInfo = dishesMap[dishIdClean];
                                  const stock = d.quantity ?? 0;
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
                                          <p className="text-sm text-gray-500 font-bold flex items-center gap-1">
                                            <span>{(dishInfo?.price || 0).toLocaleString()}</span>
                                            <Image
                                              src="/logo_point.png"
                                              alt="coin"
                                              width={14}
                                              height={14}
                                              className="object-contain inline-block"
                                            />
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

              {/* ── CHỐT CA ── */}
              {isSessionLive(currentSelectedSession) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <UtensilsCrossed className="w-4 h-4 text-[#D35400]" />
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                      Chốt ca phục vụ
                    </h2>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[30rem] overflow-y-auto pr-1">
                    {(currentSelectedSession.dishes || []).map((d) => {
                      const dishIdClean = (d.dishId ?? "").toLowerCase();
                      const dishInfo = dishesMap[dishIdClean];
                      return (
                        <div
                          key={`${d.dishId ?? ""}-${d.id ?? ""}`}
                          className="bg-white rounded-xl border border-gray-150 hover:border-orange-200 transition-all flex items-center gap-3 px-3 py-2.5"
                        >
                          <div className="relative w-10 h-10 shrink-0 rounded-lg bg-gray-50 overflow-hidden">
                            {isValidImageUrl(d.imgUrl || dishInfo?.imgUrl || dishInfo?.ImgUrl) ? (
                              <Image
                                src={d.imgUrl || dishInfo?.imgUrl || dishInfo?.ImgUrl || ""}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                🍽️
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">
                              {d.dishName || dishInfo?.name || "Món ăn"}
                            </p>
                            {(d.priceAmount ?? dishInfo?.price) !== undefined && (
                              <span className="text-[10px] font-bold text-[#D35400] flex items-center gap-0.5">
                                {d.priceAmount ?? (dishInfo?.price || 0)}
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

                          {d.preparedQuantity !== null && d.preparedQuantity !== undefined ? (
                            <span className="text-xs font-bold text-emerald-600 bg-green-50 border border-green-150 px-2.5 py-1 rounded-lg shrink-0">
                              Đã CB: {d.preparedQuantity}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-gray-400">CB:</span>
                              <input
                                type="number"
                                min="0"
                                value={preparedQuantities[d.dishId ?? ""] ?? 0}
                                onChange={(e) =>
                                  handleQuantityChange(d.dishId ?? "", e.target.value)
                                }
                                disabled={isSubmitting}
                                className="w-16 px-2 py-1.5 text-center border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400] text-sm font-bold"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-gray-600">
                        Sau khi chốt, ca ăn sẽ bị khóa và hệ thống tự động tạo đề xuất đổi món/hoàn
                        tiền cho đơn hàng bị thiếu.
                      </p>
                    </div>
                    <button
                      onClick={handleFinalize}
                      disabled={isSubmitting}
                      className="shrink-0 px-6 py-3 bg-[#D35400] hover:bg-[#b84a00] disabled:bg-gray-300 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all"
                    >
                      {isSubmitting ? "Đang chốt..." : "Chốt ca ăn"}
                    </button>
                  </div>
                </div>
              )}
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
