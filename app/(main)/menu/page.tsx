"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useEffect, useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import { useCategories, useMealDetail, useAllDishes } from "@/lib/hooks/useCanteen";
import type { MealTemplate } from "@/types/meal.types";
import type { Dish } from "@/types/dish.types";
import type { CartItem } from "@/context/cart-context";
import { useCart } from "@/context/cart-context";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import { ShoppingCart, X, Clock, Trash2, CalendarDays } from "lucide-react";
import { isSessionExpired, isSessionUpcoming } from "@/lib/utils";

const getSafeImageUrl = (
  url: string | null | undefined,
  fallback: string = "/placeholder-food.png",
): string => {
  if (!url || url.trim() === "") return fallback;
  if (url.startsWith("/")) return url;
  try {
    new URL(url);
    return url;
  } catch {
    return fallback;
  }
};

function formatTimeRange(from: string, to: string): string {
  try {
    const f = new Date(from);
    const t = new Date(to);
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
    return `${f.toLocaleTimeString("vi-VN", opts)} - ${t.toLocaleTimeString("vi-VN", opts)}`;
  } catch {
    return "";
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const dow = d.toLocaleDateString("vi-VN", { weekday: "long" });
    const date = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${dow}, ${date}`;
  } catch {
    return "";
  }
}

function MenuContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const { data: categoriesData, isLoading: loadingCats } = useCategories();
  const { data: allDishesData, isLoading: loadingDishes } = useAllDishes();
  const { data: mealDetail, isLoading: loadingMeal } = useMealDetail(sessionId);

  const {
    addToCart,
    setMealId,
    cartItems,
    getCartTotal,
    getCartCount,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    openCart,
    closeCart,
  } = useCart();

  const isLoading = loadingCats || loadingDishes || loadingMeal;

  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeftAmt, setScrollLeftAmt] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const prevSessionId = useRef(sessionId);
  const trayRef = useRef<HTMLDivElement>(null);

  const [isDragOverTray, setIsDragOverTray] = useState(false);

  const heroImages = useMemo(
    () => ["/img1.jpg", "/img7.jpg", "/img3.jpg", "/img4.jpg", "/img5.jpg", "/img6.png"],
    [],
  );
  const [heroImageIdx, setHeroImageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const noTemplateChosen = selectedTemplateIdx === null;

  const expired = mealDetail ? isSessionExpired(mealDetail.availableTo) : false;
  const upcoming = mealDetail ? isSessionUpcoming(mealDetail.availableFrom) : false;
  const canOrder = !expired && !upcoming;

  useEffect(() => {
    if (sessionId) {
      setMealId(sessionId);
      if (prevSessionId.current !== sessionId) {
        setSelectedTemplateIdx(null);
        prevSessionId.current = sessionId;
      }
    }
  }, [sessionId, setMealId]);

  useEffect(() => {
    if (selectedCategoryId === null && categoriesData?.items && categoriesData.items.length > 0) {
    }
  }, [categoriesData, selectedCategoryId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setDragStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftAmt(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    carouselRef.current.scrollLeft = scrollLeftAmt - (x - dragStartX) * 1.5;
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDragStart = (e: React.DragEvent, dishData: Record<string, unknown>) => {
    e.dataTransfer.setData("application/json", JSON.stringify(dishData));
    e.dataTransfer.effectAllowed = "move";

    const dragImg = document.createElement("div");
    dragImg.style.cssText = `
      position:fixed;top:-1000px;left:-1000px;
      width:72px;height:72px;border-radius:50%;
      background:white;border:3px solid #FF4C24;
      box-shadow:0 8px 25px rgba(0,0,0,0.18);
    `;
    const img = document.createElement("img");
    img.src = (dishData.finalImageUrl as string) || "/placeholder-food.png";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;";
    dragImg.appendChild(img);
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 36, 36);
    setTimeout(() => {
      if (document.body.contains(dragImg)) document.body.removeChild(dragImg);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTray(true);
  };

  const handleDragLeave = () => {
    setIsDragOverTray(false);
  };

  const handleDropOnTray = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTray(false);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const payload = JSON.parse(dataStr);
      const {
        finalDishGuid,
        name,
        dishPrice,
        finalImageUrl,
        description,
        categoryId,
        categoryName,
        maxQuantity,
        cartCount,
      } = payload as {
        finalDishGuid: string;
        name: string;
        dishPrice: number;
        finalImageUrl: string;
        description?: string;
        categoryId: string;
        categoryName: string;
        maxQuantity: number | null;
        cartCount: number;
      };

      if (maxQuantity !== null && cartCount >= maxQuantity) {
        toast.error(`B?n danh m?c ${categoryName} da dat gioi han toi da`);
        return;
      }

      addToCart(
        {
          dishId: finalDishGuid,
          name,
          price: dishPrice,
          imgUrl: finalImageUrl,
          description: description || "Fresh select item.",
          mealId: sessionId || undefined,
          mealName: mealDetail?.name || undefined,
          categoryId,
          categoryName,
          mealTime: mealDetail?.availableForOrder || undefined,
        },
        1,
      );
      toast.success(`Da them ${name} vao khay!`);
    } catch (err) {
      console.error(err);
    }
  };

  const dishes = useMemo(() => {
    if (!allDishesData?.items) return [];
    if (mealDetail?.dishes && mealDetail.dishes.length > 0) {
      const allowedDishIds = new Set(mealDetail.dishes.map((d) => d.dishId));
      return allDishesData.items.filter((dish) => allowedDishIds.has(dish.id));
    }
    return allDishesData.items;
  }, [mealDetail, allDishesData]);

  const templates: MealTemplate[] = mealDetail?.mealTemplates || [];
  const selectedTemplate = selectedTemplateIdx !== null ? templates[selectedTemplateIdx] : null;

  const categories = useMemo(() => {
    const all = categoriesData?.items || [];
    if (selectedTemplate) {
      const ids = new Set(selectedTemplate.settings.map((s) => s.categoryId));
      return all.filter((c) => ids.has(c.id));
    }
    return all;
  }, [categoriesData, selectedTemplate]);

  const getSettingForCategory = (categoryId: string) =>
    (selectedTemplate ?? templates[0] ?? null)?.settings.find((s) => s.categoryId === categoryId) ||
    null;

  const getCartCountForCategory = (categoryId: string) => {
    const catDishIds = new Set(dishes.filter((d) => d.categoryId === categoryId).map((d) => d.id));
    return cartItems
      .filter((item) => catDishIds.has(item.dishId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && isCartOpen) {
        closeCart();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCartOpen, closeCart]);

  if (!sessionId) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-2xl">
            🍽️
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Chua chon phien an</h1>
          <Link
            href="/session"
            className="bg-[#FF4C24] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md"
          >
            Chon Phien An
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pb-32 font-sans overflow-x-hidden">
        {/* ── HERO: CAROUSEL OF CANTEEN IMAGES ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 pt-6">
          <div className="relative w-full min-h-[180px] md:min-h-[220px] rounded-[2.5rem] overflow-hidden shadow-lg">
            {heroImages.map((src, idx) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === heroImageIdx ? "opacity-100" : "opacity-0"}`}
              >
                <Image src={src} alt="" fill className="object-cover" priority={idx === 0} />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
            {/* Carousel indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroImageIdx(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === heroImageIdx ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <div className="relative z-10 px-6 md:px-10 py-7 md:py-9 text-white">
              <div className="flex flex-wrap items-center gap-2 text-white/80 text-xs font-medium mb-2">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  #{mealDetail?.availableForOrder || "dang chon"}
                </span>
                {expired && (
                  <span className="bg-red-500/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-red-100 font-bold">
                    DA HET PHIEN
                  </span>
                )}
                {upcoming && (
                  <span className="bg-blue-500/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-blue-100 font-bold">
                    SAP DIEN RA
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
                {mealDetail?.name || "Dang tai thuc don..."}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-3 text-white/90 text-sm font-medium">
                <span className="flex items-center gap-1.5 drop-shadow-sm">
                  <Clock className="w-4 h-4" />
                  {mealDetail
                    ? formatTimeRange(mealDetail.availableFrom, mealDetail.availableTo)
                    : "--:--"}
                </span>
                <span className="flex items-center gap-1.5 drop-shadow-sm">
                  <CalendarDays className="w-4 h-4" />
                  {mealDetail ? formatDate(mealDetail.availableFrom) : "--"}
                </span>
              </div>

              <p className="text-white/70 text-xs mt-2 max-w-xl leading-relaxed drop-shadow-sm">
                {mealDetail?.description ||
                  "Kham pha thuc don phong phu va dat mon an ngon cho bua an cua ban."}
                {expired && " Phien an nay da ket thuc, ban khong the dat mon."}
                {upcoming && " Phien an nay chua bat dau."}
              </p>
            </div>
          </div>
        </div>

        {/* ── TEMPLATE CAROUSEL ── */}
        {templates.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 pt-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100/60 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-2 h-2 rounded-full ${noTemplateChosen ? "bg-[#FF4C24] animate-pulse" : "bg-green-400"}`}
                />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {noTemplateChosen ? "Chon Template de bat dau dat mon" : "Dang dat mon theo:"}
                </span>
              </div>
              <div
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="flex gap-3 overflow-x-auto scrollbar-none pb-1 select-none active:cursor-grabbing cursor-grab"
              >
                {templates.map((t, idx) => {
                  const isActive = selectedTemplateIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedTemplateIdx(isActive ? null : idx)}
                      className={`shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "bg-[#FF4C24] text-white shadow-lg shadow-orange-500/20 scale-105 border-2 border-[#FF4C24]"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-[#FF4C24] hover:text-[#FF4C24] hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN TWO-COLUMN LAYOUT ── */}
        <div className="flex flex-col lg:flex-row mt-6">
          {/* ═══════ LEFT COLUMN: MAM BIG, flush left ── */}
          <div
            ref={trayRef}
            className="w-full lg:w-[440px] xl:w-[520px] shrink-0 lg:sticky lg:top-4 self-start"
          >
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDropOnTray}
              className={`relative w-full aspect-square transition-all duration-300 ${
                isDragOverTray ? "scale-105" : ""
              }`}
            >
              <Image
                src="/mam.png"
                alt="Tray"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />

              {cartItems.length > 0 && (
                <div className="absolute inset-0">
                  {cartItems.map((item, idx) => {
                    const positions = [
                      { top: "22%", left: "22%", w: "17%", h: "19%" },
                      { top: "22%", left: "54%", w: "17%", h: "19%" },
                      { top: "56%", left: "18%", w: "17%", h: "19%" },
                      { top: "56%", left: "50%", w: "17%", h: "19%" },
                      { top: "38%", left: "7%", w: "14%", h: "16%" },
                      { top: "14%", left: "40%", w: "14%", h: "16%" },
                      { top: "60%", left: "70%", w: "14%", h: "16%" },
                      { top: "38%", left: "38%", w: "17%", h: "19%" },
                    ];
                    const p = positions[Math.min(idx, positions.length - 1)];
                    const tilt = idx % 2 === 0 ? "rotate(-3deg)" : "rotate(4deg)";
                    return (
                      <div
                        key={item.dishId}
                        className="absolute transition-all duration-300 hover:z-10"
                        style={{
                          top: p.top,
                          left: p.left,
                          width: p.w,
                          height: p.h,
                          transform: tilt,
                        }}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={item.imgUrl || "/placeholder-food.png"}
                            alt={item.name}
                            fill
                            className="object-cover rounded-full border-[3px] border-white/90 shadow-lg"
                            sizes="80px"
                          />
                        </div>
                        {item.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 bg-[#FF4C24] text-white text-[8px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 shadow-md border border-white/60">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isDragOverTray && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-[#FF4C24]/90 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg animate-bounce z-20">
                    Tha vao day!
                  </span>
                </div>
              )}

              {cartItems.length === 0 && !isDragOverTray && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-[10px] font-bold bg-white/70 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                    Keo tha mon vao day
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ RIGHT COLUMN: CATEGORIES + DISHES ═══════ */}
          <div className="flex-1 min-w-0 space-y-3 px-4 md:pr-12 md:pl-8">
            {/* Categories: horizontal round scroll */}
            {categories.length === 0 && !isLoading ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm font-bold">Khong co danh muc nao cho phien an nay.</p>
              </div>
            ) : (
              <>
                {/* Round Category Carousel */}
                <div className="overflow-x-auto scrollbar-none -mx-4 md:-mx-0 px-4 md:px-0">
                  <div className="flex gap-6 md:gap-8 pb-3">
                    {/* All button */}
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="flex flex-col items-center gap-2 shrink-0 group"
                    >
                      <div
                        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center ${
                          selectedCategoryId === null
                            ? "ring-3 ring-[#FF4C24] ring-offset-2 scale-110 shadow-lg shadow-orange-500/20 bg-[#FF4C24] text-white animate-bounce-subtle"
                            : "ring-1 ring-gray-200 bg-gray-100 text-gray-500 hover:ring-[#FF4C24]/50 hover:scale-110 hover:-translate-y-0.5"
                        }`}
                      >
                        <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <span
                        className={`text-[11px] font-bold whitespace-nowrap transition-colors duration-200 ${
                          selectedCategoryId === null
                            ? "text-[#FF4C24]"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                      >
                        All
                      </span>
                    </button>

                    {categories.map((category) => {
                      const catDishes = dishes.filter((d) => d.categoryId === category.id);
                      if (catDishes.length === 0) return null;
                      const isActive = selectedCategoryId === category.id;
                      const cartCount = getCartCountForCategory(category.id);
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="flex flex-col items-center gap-2 shrink-0 group"
                        >
                          <div
                            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden transition-all duration-300 ${
                              isActive
                                ? "ring-3 ring-[#FF4C24] ring-offset-2 scale-110 shadow-lg shadow-orange-500/20 animate-bounce-subtle"
                                : "ring-1 ring-gray-200 hover:ring-[#FF4C24]/50 hover:scale-110 hover:-translate-y-0.5"
                            }`}
                          >
                            <Image
                              src={getSafeImageUrl(category.imgUrl, "/placeholder-food.png")}
                              alt={category.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            {cartCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-[#FF4C24] text-white text-[8px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md">
                                {cartCount}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-bold whitespace-nowrap transition-colors duration-200 ${
                              isActive
                                ? "text-[#FF4C24]"
                                : "text-gray-500 group-hover:text-gray-700"
                            }`}
                          >
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dishes: All or selected category */}
                {selectedCategoryId === null ? (
                  /* ── ALL: show all categories with dishes ── */
                  <div className="space-y-6">
                    {categories.map((cat) => {
                      const catDishes = dishes.filter((d) => d.categoryId === cat.id);
                      if (catDishes.length === 0) return null;
                      const setting = getSettingForCategory(cat.id);
                      const cartCount = getCartCountForCategory(cat.id);
                      const catExpired = expired;
                      const notInTemplate =
                        setting === null && (selectedTemplate ?? templates[0] ?? null) !== null;

                      return (
                        <div
                          key={cat.id}
                          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                        >
                          <div className="p-3 md:p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image
                                  src={getSafeImageUrl(cat.imgUrl, "/placeholder-food.png")}
                                  alt={cat.name}
                                  fill
                                  className="object-cover"
                                  sizes="24px"
                                />
                              </div>
                              <span className="text-sm font-black text-gray-900">{cat.name}</span>
                              {setting && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  ({cartCount}/{setting.maxQuantity})
                                </span>
                              )}
                            </div>
                            <DishGrid
                              dishes={catDishes}
                              categoryName={cat.name}
                              categoryId={cat.id}
                              setting={setting}
                              cartCount={cartCount}
                              catExpired={catExpired}
                              notInTemplate={notInTemplate}
                              canOrder={canOrder}
                              noTemplateChosen={noTemplateChosen}
                              expired={expired}
                              sessionId={sessionId}
                              mealDetail={mealDetail}
                              onAddToCart={addToCart}
                              onDragStart={handleDragStart}
                              getSafeImageUrl={getSafeImageUrl}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ── SINGLE CATEGORY ── */
                  (() => {
                    const activeCat = categories.find((c) => c.id === selectedCategoryId);
                    if (!activeCat) return null;
                    const categoryDishes = dishes.filter((d) => d.categoryId === activeCat.id);
                    if (categoryDishes.length === 0) return null;

                    const setting = getSettingForCategory(activeCat.id);
                    const cartCount = getCartCountForCategory(activeCat.id);
                    const catExpired = expired;
                    const notInTemplate =
                      setting === null && (selectedTemplate ?? templates[0] ?? null) !== null;

                    return (
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-3 md:p-4">
                          {catExpired && (
                            <div className="mb-3 px-3 py-2 bg-red-50/80 border border-red-100 rounded-xl text-center">
                              <span className="text-[11px] font-bold text-red-400">
                                Phien an da ket thuc
                              </span>
                            </div>
                          )}
                          <DishGrid
                            dishes={categoryDishes}
                            categoryName={activeCat.name}
                            categoryId={activeCat.id}
                            setting={setting}
                            cartCount={cartCount}
                            catExpired={catExpired}
                            notInTemplate={notInTemplate}
                            canOrder={canOrder}
                            noTemplateChosen={noTemplateChosen}
                            expired={expired}
                            sessionId={sessionId}
                            mealDetail={mealDetail}
                            onAddToCart={addToCart}
                            onDragStart={handleDragStart}
                            getSafeImageUrl={getSafeImageUrl}
                          />
                        </div>
                      </div>
                    );
                  })()
                )}
              </>
            )}
          </div>
        </div>

        {/* ── MOBILE FAB: open cart drawer ── */}
        <button
          onClick={openCart}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#FF4C24] text-white rounded-full shadow-[0_4px_15px_rgba(255,76,36,0.3)] flex items-center justify-center active:scale-90"
        >
          <ShoppingCart className="w-6 h-6" />
          {getCartCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[#FF4C24] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FF4C24]">
              {getCartCount()}
            </span>
          )}
        </button>

        {/* ── CART DRAWER (slide from right) ── */}
        <div
          className={`fixed inset-0 bg-black/25 backdrop-blur-xs z-50 transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        />
        <div
          ref={drawerRef}
          className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#FF4C24]" />
              <h2 className="text-base font-extrabold text-gray-800">Gio hang cua ban</h2>
            </div>
            <button onClick={closeCart} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-140px)] p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-bold">
                Gio hang dang trong.
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={`${item.dishId}-${idx}`}>
                  {(idx === 0 || cartItems[idx - 1].mealName !== item.mealName) && (
                    <div className="flex items-center gap-2 mb-2 mt-2 first:mt-0">
                      <span className="text-[10px] font-extrabold text-[#FF4C24] uppercase tracking-wider">
                        {item.mealName || "Current Session"}
                      </span>
                      {item.mealTime && (
                        <span className="text-[9px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {item.mealTime}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.imgUrl || "/placeholder-food.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-[#FF4C24] inline-flex items-center gap-1">
                          {item.price}
                          <Image
                            src="/logo_point.png"
                            alt=""
                            width={12}
                            height={12}
                            className="object-contain"
                          />
                        </p>
                        {item.categoryName && (
                          <span className="text-[9px] text-gray-400 bg-white px-1 py-0.5 rounded border border-gray-100">
                            {item.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-[#FF4C24]"
                      >
                        -
                      </button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-[#FF4C24]"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.dishId)}
                        className="p-1 text-gray-300 hover:text-red-500 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Tong diem</span>
              <span className="text-base font-black text-[#FF4C24] inline-flex items-center gap-1">
                {getCartTotal()}
                <Image
                  src="/logo_point.png"
                  alt=""
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </span>
            </div>
            <Link
              href={canOrder ? ROUTES.CHECKOUT : "#"}
              onClick={(e) => {
                if (!canOrder) {
                  e.preventDefault();
                  toast.error(expired ? "Phien an da ket thuc" : "Phien an chua bat dau");
                } else {
                  closeCart();
                }
              }}
              className={`flex items-center justify-center w-full py-3 font-black text-xs rounded-xl uppercase tracking-wider transition-all ${
                canOrder
                  ? "bg-[#FF4C24] hover:bg-[#E03A14] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Tien hanh thanh toan
            </Link>
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-subtle {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 1.5s ease-in-out infinite; }
      `,
        }}
      />
    </>
  );
}

function DishCard({
  dish,
  disabled,
  notInTemplate,
  canOrder,
  noTemplateChosen,
  expired,
  canAddMore,
  setting,
  categoryName,
  categoryId,
  sessionId,
  mealDetail,
  dragPayload,
  onAddToCart,
  onDragStart,
  getUrl,
}: {
  dish: Dish;
  disabled: boolean;
  notInTemplate: boolean;
  canOrder: boolean;
  noTemplateChosen: boolean;
  expired: boolean;
  canAddMore: boolean;
  setting: { maxQuantity: number } | null;
  categoryName: string;
  categoryId: string;
  sessionId: string | null;
  mealDetail: { name?: string; availableForOrder?: string } | null;
  dragPayload: Record<string, unknown>;
  onAddToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  onDragStart: (e: React.DragEvent, data: Record<string, unknown>) => void;
  getUrl: (url: string | null | undefined, fallback?: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || disabled) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const finalImageUrl = getUrl(dish.imgUrl);
  const dishPrice =
    (dish as { priceAmount?: number; price?: number }).priceAmount ??
    (dish as { price?: number }).price ??
    0;

  return (
    <div
      ref={cardRef}
      draggable={canOrder && !notInTemplate}
      onDragStart={(e) => {
        if (!disabled) onDragStart(e, dragPayload);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (disabled) {
          if (notInTemplate) toast.error("Danh muc nay khong co trong template");
          else if (noTemplateChosen) toast.error("Chon template de dat mon");
          else if (expired) toast.error("Phien an da ket thuc");
          return;
        }
        if (setting && !canAddMore) {
          toast.error(`Da gioi han so luong mon cho danh muc ${categoryName}`);
          return;
        }
        onAddToCart(
          {
            dishId: dragPayload.finalDishGuid as string,
            name: dish.name,
            price: dishPrice,
            imgUrl: finalImageUrl,
            description: dish.description || "Fresh select item.",
            mealId: sessionId || undefined,
            mealName: mealDetail?.name || undefined,
            categoryId,
            categoryName,
            mealTime: mealDetail?.availableForOrder || undefined,
          },
          1,
        );
        toast.success(`Da them ${dish.name}`);
      }}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1,1,1)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "all 0.5s ease" : "none",
      }}
      className={`group bg-white rounded-2xl border p-2.5 md:p-3 flex flex-col items-center text-center transition-shadow duration-300 ${
        disabled
          ? notInTemplate
            ? "border-gray-100 opacity-45 grayscale-[0.3]"
            : "pointer-events-none opacity-50"
          : "cursor-pointer hover:shadow-xl active:scale-[0.97] hover:border-orange-200 border-gray-100"
      }`}
    >
      <div
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-50 border border-gray-100 mb-2 shadow-inner group-hover:scale-105 transition-transform duration-300"
        style={{ transformStyle: "preserve-3d", transform: `translateZ(20px)` }}
      >
        <Image src={finalImageUrl} alt={dish.name} fill sizes="80px" className="object-cover" />
        {!disabled && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
            <span className="bg-[#FF4C24] text-white text-[9px] font-black uppercase px-2 py-1 rounded-full shadow-lg">
              + Add
            </span>
          </div>
        )}
      </div>
      <div className="w-full">
        <h4 className="font-extrabold text-gray-800 text-[11px] sm:text-xs line-clamp-1 leading-tight">
          {dish.name}
        </h4>
        {dish.description && (
          <p className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed mt-0.5">
            {dish.description}
          </p>
        )}
        <p className="font-black text-[#FF4C24] text-[11px] sm:text-xs mt-1 inline-flex items-center gap-1">
          {dishPrice}
          <Image src="/logo_point.png" alt="" width={12} height={12} className="object-contain" />
        </p>
      </div>
    </div>
  );
}

function DishGrid({
  dishes: categoryDishes,
  categoryName,
  categoryId,
  setting,
  cartCount,
  catExpired,
  notInTemplate,
  canOrder,
  noTemplateChosen,
  expired,
  sessionId,
  mealDetail,
  onAddToCart,
  onDragStart,
  getSafeImageUrl: getUrl,
}: {
  dishes: Dish[];
  categoryName: string;
  categoryId: string;
  setting: { maxQuantity: number } | null;
  cartCount: number;
  catExpired: boolean;
  notInTemplate: boolean;
  canOrder: boolean;
  noTemplateChosen: boolean;
  expired: boolean;
  sessionId: string | null;
  mealDetail: { name?: string; availableForOrder?: string } | null;
  onAddToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  onDragStart: (e: React.DragEvent, data: Record<string, unknown>) => void;
  getSafeImageUrl: (url: string | null | undefined, fallback?: string) => string;
}) {
  const canAddMore = !setting || cartCount < setting.maxQuantity;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
      {categoryDishes.map((dish) => {
        const finalImageUrl = getUrl(dish.imgUrl);
        const finalDishGuid = (dish as { dishId?: string }).dishId || dish.id;
        const disabled = catExpired || notInTemplate;

        const dragPayload = {
          finalDishGuid,
          name: dish.name,
          dishPrice:
            (dish as { priceAmount?: number; price?: number }).priceAmount ??
            (dish as { price?: number }).price ??
            0,
          finalImageUrl,
          description: dish.description,
          categoryId,
          categoryName,
          maxQuantity: setting ? setting.maxQuantity : null,
          cartCount,
        };

        return (
          <DishCard
            key={dish.id}
            dish={dish}
            disabled={disabled}
            notInTemplate={notInTemplate}
            canOrder={canOrder}
            noTemplateChosen={noTemplateChosen}
            expired={expired}
            canAddMore={canAddMore}
            setting={setting}
            categoryName={categoryName}
            categoryId={categoryId}
            sessionId={sessionId}
            mealDetail={mealDetail}
            dragPayload={dragPayload}
            onAddToCart={onAddToCart}
            onDragStart={onDragStart}
            getUrl={getUrl}
          />
        );
      })}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4C24]" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
