"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import Navbar from "@/components/layout/Navbar";
import { useCategories, useSessionDetail, useAllDishes } from "@/lib/hooks/useCanteen";
import type { Dish } from "@/types/dish.types";
import type { CartItem } from "@/context/cart-context";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import { animate, stagger, spring } from "animejs";
import { ShoppingCart, Clock, CalendarDays } from "lucide-react";
import { isSessionExpired } from "@/lib/utils";
import { useCurrency } from "@/lib/hooks/use-currency";

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

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { data: categoriesData, isLoading: loadingCats } = useCategories();
  const { data: allDishesData, isLoading: loadingDishes } = useAllDishes();
  const { data: sessionDetail, isLoading: loadingMeal } = useSessionDetail(sessionId);
  const { formatPoints } = useCurrency();

  const {
    addToCart: contextAddToCart,
    setSessionId,
    cartItems,
    openCart,
    removeBySessionId,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const sessionCartCount = useMemo(() => {
    if (!sessionId) return 0;
    return cartItems
      .filter((item) => item.sessionId === sessionId)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, sessionId]);

  const isLoading = loadingCats || loadingDishes || loadingMeal;

  // mealDetail alias for backward compatibility in JSX
  const mealDetail = sessionDetail ?? null;

  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Wraps addToCart to always inject the selected template's ID
  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, qty: number) => {
      contextAddToCart(
        {
          ...item,
          sessionTemplateId:
            selectedTemplateIdx !== null
              ? mealDetail?.mealTemplates?.[selectedTemplateIdx]?.id
              : mealDetail?.mealTemplates?.[0]?.id,
        },
        qty,
      );
    },
    [contextAddToCart, selectedTemplateIdx, mealDetail],
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeftAmt, setScrollLeftAmt] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const prevSessionId = useRef(sessionId);
  const trayRef = useRef<HTMLDivElement>(null);
  const dishGridRef = useRef<HTMLDivElement>(null);
  const fabCounterRef = useRef<HTMLSpanElement>(null);
  const prevCartCount = useRef(0);

  // Bounce animation for tray and new food items
  const animateTrayDropBounce = useCallback(() => {
    if (trayRef.current) {
      animate(trayRef.current, {
        scale: [1, 0.97, 1.02, 1],
        rotate: [0, -1, 1, 0],
        duration: 500,
        ease: spring({ stiffness: 220, damping: 11, mass: 0.9 }),
      });

      const foodItems = trayRef.current.querySelectorAll(".tray-food-item");
      const lastFoodItem = foodItems[foodItems.length - 1];
      if (lastFoodItem) {
        animate(lastFoodItem, {
          scale: [0, 1.1, 1],
          opacity: [0, 1],
          duration: 500,
          ease: spring({ stiffness: 280, damping: 12, mass: 0.8 }),
        });
      }
    }
  }, []);

  // Bounce animation for the floating cart counter badge
  const animateFabCounter = useCallback(() => {
    if (fabCounterRef.current) {
      animate(fabCounterRef.current, {
        scale: [1.35, 1],
        duration: 400,
        ease: spring({ stiffness: 350, damping: 14, mass: 1 }),
      });
    }
  }, []);

  // Click ripple effect on cards
  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 76, 36, 0.15);
      pointer-events: none;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      z-index: 20;
    `;
    target.style.position = "relative";
    target.style.overflow = "hidden";
    target.appendChild(ripple);
    animate(ripple, {
      scale: [0, 2.5],
      opacity: [1, 0],
      duration: 600,
      ease: "outQuint",
      onComplete: () => ripple.remove(),
    });
  }, []);

  // Trigger tray & FAB badge animation when cart count increases
  useEffect(() => {
    const currentCount = sessionCartCount;
    if (currentCount > prevCartCount.current) {
      setTimeout(() => {
        animateTrayDropBounce();
        animateFabCounter();
      }, 55);
    }
    prevCartCount.current = currentCount;
  }, [cartItems, sessionCartCount, animateTrayDropBounce, animateFabCounter]);

  // Staggered card entrance animation when category or loading state changes
  useEffect(() => {
    if (!isLoading && dishGridRef.current) {
      const cards = dishGridRef.current.querySelectorAll(".dish-card-customer");
      if (cards.length > 0) {
        animate(cards, {
          opacity: [0, 1],
          translateY: [20, 0],
          scale: [0.92, 1],
          delay: stagger(30, { start: 100 }),
          duration: 500,
          ease: "outQuint",
        });
      }
    }
  }, [isLoading, selectedCategoryId, selectedTemplateIdx]);

  const [isDragOverTray, setIsDragOverTray] = useState(false);
  const [isDragOverRightPanel, setIsDragOverRightPanel] = useState(false);
  const [isDishDragging, setIsDishDragging] = useState(false);

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

  const expired = mealDetail
    ? isSessionExpired(mealDetail.availableTo) ||
      !mealDetail.isActive ||
      mealDetail.isFinalized === true
    : false;
  const upcoming = mealDetail ? new Date(mealDetail.availableForOrder) > new Date() : false;
  const canOrder = !expired && !upcoming;

  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId);
      if (prevSessionId.current !== sessionId) {
        setSelectedTemplateIdx(null);
        prevSessionId.current = sessionId;
      }
    }
  }, [sessionId, setSessionId]);

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
    setIsDishDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify(dishData));
    e.dataTransfer.effectAllowed = "move";

    const dragImg = document.createElement("div");
    dragImg.style.cssText = `
      position:fixed;top:-1000px;left:-1000px;
      width:110px;height:110px;border-radius:50%;
      background:white;border:4px solid #FF4C24;
      box-shadow:0 12px 35px rgba(0,0,0,0.25);
    `;
    const img = document.createElement("img");
    img.src = (dishData.finalImageUrl as string) || "/placeholder-food.png";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;";
    dragImg.appendChild(img);
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 55, 55);
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
    setIsDishDragging(false);
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
        toast.error(`Danh mục ${categoryName} đã đạt giới hạn ${maxQuantity} món!`);
        return;
      }

      addToCart(
        {
          dishId: finalDishGuid,
          name,
          price: dishPrice,
          imgUrl: finalImageUrl,
          description: description || "Fresh select item.",
          sessionId: sessionId || undefined,
          sessionTemplateId:
            selectedTemplateIdx !== null
              ? mealDetail?.mealTemplates[selectedTemplateIdx].id
              : mealDetail?.mealTemplates[0]?.id,
          sessionName: mealDetail?.name || undefined,
          categoryId,
          categoryName,
          sessionTime: mealDetail
            ? `${mealDetail.availableFrom} - ${mealDetail.availableTo}`
            : undefined,
        },
        1,
      );
      toast.success(`Đã thêm ${name} vào khay!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropFromTray = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const source = e.dataTransfer.getData("source");
        if (source !== "tray") return;

        const dishId = e.dataTransfer.getData("text/plain");
        if (!dishId) return;

        const existingItem = cartItems.find(
          (item) => item.dishId === dishId && item.sessionId === (sessionId || undefined),
        );
        if (!existingItem) return;

        if (existingItem.quantity > 1) {
          updateQuantity(dishId, existingItem.quantity - 1, sessionId || undefined);
          toast.success(`Đã giảm số lượng món ${existingItem.name}`);
        } else {
          removeFromCart(dishId, sessionId || undefined);
          toast.success(`Đã xóa món ${existingItem.name} khỏi khay`);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [cartItems, sessionId, updateQuantity, removeFromCart],
  );

  const handleDragOverRightPanel = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverRightPanel(true);
  }, []);

  const dishes = useMemo(() => {
    if (mealDetail?.dishes && mealDetail.dishes.length > 0) {
      const hasRichData = mealDetail.dishes.some((d) => d.dishName);
      if (hasRichData && allDishesData?.items) {
        const dishMap = new Map(allDishesData.items.map((d) => [d.id, d]));
        return mealDetail.dishes
          .map(
            (sd) =>
              dishMap.get(sd.dishId) ??
              ({
                id: sd.dishId,
                dishId: sd.dishId,
                name: sd.dishName ?? "",
                imgUrl: sd.imgUrl ?? null,
                price: sd.priceAmount ?? 0,
                priceAmount: sd.priceAmount ?? 0,
                description: "",
                categoryId: sd.categoryId ?? "",
                isActive: true,
              } as Dish),
          )
          .filter(Boolean);
      }
      const allowedDishIds = new Set(mealDetail.dishes.map((d) => d.dishId));
      return allDishesData?.items?.filter((dish) => allowedDishIds.has(dish.id)) ?? [];
    }
    return allDishesData?.items ?? [];
  }, [mealDetail, allDishesData]);

  const templates = useMemo(() => mealDetail?.mealTemplates || [], [mealDetail?.mealTemplates]);
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
    selectedTemplate?.settings.find((s) => s.categoryId === categoryId) || null;

  const getCartCountForCategory = (categoryId: string) => {
    if (!sessionId) return 0;
    const catDishIds = new Set(dishes.filter((d) => d.categoryId === categoryId).map((d) => d.id));
    return cartItems
      .filter((item) => item.sessionId === sessionId && catDishIds.has(item.dishId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getDishQuantityInSession = (dishId: string) => {
    if (!sessionId) return 0;
    return cartItems
      .filter((item) => item.sessionId === sessionId && item.dishId === dishId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Auto-select first template when templates load
  useEffect(() => {
    if (templates.length > 0 && selectedTemplateIdx === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateIdx(0);
    }
  }, [templates, selectedTemplateIdx]);

  if (!sessionId) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-2xl">
            🍽️
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Chưa chọn phiên ăn</h1>
          <Link
            href="/session"
            className="bg-[#FF4C24] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md"
          >
            Chọn Phiên Ăn
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pb-32 font-sans overflow-x-hidden w-full px-8">
        {/* ── HERO: CAROUSEL OF CANTEEN IMAGES ── */}
        <div className="w-full pt-6">
          <div className="relative w-full min-h-[220px] md:min-h-[300px] rounded-[2.5rem] overflow-hidden shadow-lg">
            {heroImages.map((src, idx) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === heroImageIdx ? "opacity-100" : "opacity-0"}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  priority={idx === 0}
                  sizes="100vw"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
            {/* Carousel indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
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

            <div className="relative z-10 px-10 md:px-16 py-12 md:py-16 text-white">
              <div className="flex flex-wrap items-center gap-2 text-white/80 text-xs font-medium mb-3">
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm font-bold">
                  {mealDetail?.availableForOrder
                    ? `Mở đặt ${new Date(mealDetail.availableForOrder).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                    : "dang chon"}
                </span>
                {expired && (
                  <span className="bg-red-500/50 px-3 py-1 rounded-full backdrop-blur-sm text-red-100 font-bold">
                    {mealDetail?.isFinalized ? "ĐÃ CHỐT ĐƠN" : "ĐÃ HẾT PHIÊN"}
                  </span>
                )}
                {upcoming && (
                  <span className="bg-blue-500/50 px-3 py-1 rounded-full backdrop-blur-sm text-blue-100 font-bold">
                    SẮP DIỄN RA
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight drop-shadow-sm">
                {mealDetail?.name || "Dang tai thuc don..."}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-5 text-white/90 text-base font-bold">
                <span className="flex items-center gap-1.5 drop-shadow-sm bg-black/20 px-4 py-1.5 rounded-xl">
                  <Clock className="w-5 h-5 text-orange-400" />
                  {mealDetail
                    ? formatTimeRange(mealDetail.availableFrom, mealDetail.availableTo)
                    : "--:--"}
                </span>
                <span className="flex items-center gap-1.5 drop-shadow-sm bg-black/20 px-4 py-1.5 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-orange-400" />
                  {mealDetail ? formatDate(mealDetail.availableFrom) : "--"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TEMPLATE CAROUSEL ── */}
        {templates.length > 0 && (
          <div className="w-full pt-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-[2rem] p-4 border border-orange-100 shadow-sm">
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${noTemplateChosen ? "bg-[#FF4C24] animate-pulse" : "bg-green-500"}`}
                />
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  {noTemplateChosen ? "Chọn Template để bắt đầu đặt món" : "Đang đặt món theo:"}
                </span>
              </div>
              <div
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="flex gap-3 overflow-x-auto scrollbar-none pb-1 select-none active:cursor-grabbing cursor-grab items-center"
              >
                {templates.map((t, idx) => {
                  const isActive = selectedTemplateIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isActive) {
                          setSelectedTemplateIdx(null);
                        } else if (sessionId) {
                          removeBySessionId(sessionId);
                          setSelectedTemplateIdx(idx);
                        } else {
                          setSelectedTemplateIdx(idx);
                        }
                      }}
                      className={`shrink-0 px-6 py-3 rounded-xl text-sm font-black transition-all duration-200 whitespace-nowrap shadow-xs ${
                        isActive
                          ? "bg-[#FF4C24] text-white shadow-lg shadow-orange-500/30 scale-105 border-2 border-[#FF4C24]"
                          : "bg-white text-gray-700 border-2 border-gray-100 hover:border-[#FF4C24] hover:text-[#FF4C24] hover:shadow-md"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
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
        <div className="w-full flex flex-col lg:flex-row mt-8 gap-8">
          {/* ═══════ LEFT COLUMN: MÂM ── */}
          <div
            ref={trayRef}
            className="w-full lg:w-[420px] xl:w-[500px] shrink-0 lg:sticky lg:top-24 self-start bg-gray-50 rounded-[3.5rem] p-6 border border-gray-100/70 shadow-xs"
          >
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDropOnTray}
              className={`relative w-full aspect-square transition-all duration-300 ${
                isDragOverTray ? "scale-[1.03]" : ""
              }`}
            >
              <Image
                src="/mam.png"
                alt="Tray"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                sizes="(max-width: 1024px) 100vw, 680px"
              />

              {mounted && cartItems.filter((i) => i.sessionId === sessionId).length > 0 && (
                <div className="absolute inset-0" suppressHydrationWarning>
                  {cartItems
                    .filter((i) => i.sessionId === sessionId)
                    .map((item, idx) => {
                      const positions = [
                        { top: "24%", left: "24%", w: "16%", h: "16%" },
                        { top: "24%", left: "54%", w: "16%", h: "16%" },
                        { top: "56%", left: "22%", w: "16%", h: "16%" },
                        { top: "56%", left: "52%", w: "16%", h: "16%" },
                        { top: "40%", left: "8%", w: "13%", h: "13%" },
                        { top: "16%", left: "42%", w: "13%", h: "13%" },
                        { top: "60%", left: "72%", w: "13%", h: "13%" },
                        { top: "40%", left: "39%", w: "16%", h: "16%" },
                      ];
                      const p = positions[Math.min(idx, positions.length - 1)];
                      const tilt = idx % 2 === 0 ? "rotate(-3deg)" : "rotate(4deg)";
                      return (
                        <div
                          key={`${item.dishId}-${item.sessionId}`}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", item.dishId);
                            e.dataTransfer.setData("source", "tray");
                            e.dataTransfer.effectAllowed = "move";

                            const dragImg = document.createElement("div");
                            dragImg.style.cssText = `
                              position:fixed;top:-1000px;left:-1000px;
                              width:80px;height:80px;border-radius:50%;
                              background:white;border:3px solid #FF4C24;
                              box-shadow:0 8px 25px rgba(0,0,0,0.2);
                            `;
                            const img = document.createElement("img");
                            img.src = item.imgUrl || "/placeholder-food.png";
                            img.style.cssText =
                              "width:100%;height:100%;object-fit:cover;border-radius:50%;";
                            dragImg.appendChild(img);
                            document.body.appendChild(dragImg);
                            e.dataTransfer.setDragImage(dragImg, 40, 40);
                            setTimeout(() => {
                              if (document.body.contains(dragImg))
                                document.body.removeChild(dragImg);
                            }, 0);
                          }}
                          className="absolute transition-all duration-300 hover:z-10 cursor-grab active:cursor-grabbing"
                          style={{
                            top: p.top,
                            left: p.left,
                            width: p.w,
                            height: p.h,
                            transform: tilt,
                          }}
                        >
                          <div className="relative w-full aspect-square rounded-full overflow-hidden border-[3px] border-white shadow-lg tray-food-item">
                            <Image
                              src={item.imgUrl || "/placeholder-food.png"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-full"
                              sizes="160px"
                            />
                          </div>
                          {item.quantity > 1 && (
                            <span className="absolute -top-1 -right-1.5 bg-[#FF4C24] text-white text-[9px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-md border-2 border-white">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {isDragOverTray && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full backdrop-blur-xs pointer-events-none">
                  <span className="bg-[#FF4C24] text-white text-base font-black px-8 py-4 rounded-full shadow-2xl animate-bounce z-20 tracking-wider">
                    Thả vào đây!
                  </span>
                </div>
              )}

              {(!mounted || cartItems.filter((i) => i.sessionId === sessionId).length === 0) &&
                !isDragOverTray && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    suppressHydrationWarning
                  >
                    <p className="text-gray-400 text-sm font-black bg-white px-5 py-3 rounded-full shadow-md border border-gray-150">
                      Kéo thả món ăn vào đây
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: CATEGORIES + DISHES ── */}
          <div
            ref={dishGridRef}
            onDragOver={handleDragOverRightPanel}
            onDragLeave={() => setIsDragOverRightPanel(false)}
            onDrop={(e) => {
              setIsDragOverRightPanel(false);
              handleDropFromTray(e);
            }}
            className={`flex-1 min-w-0 space-y-8 transition-all duration-300 rounded-[2.5rem] p-6 lg:overflow-y-auto lg:max-h-[calc(100vh-10rem)] ${
              isDragOverRightPanel ? "bg-orange-50/30 ring-2 ring-dashed ring-[#FF4C24]/30" : ""
            }`}
          >
            {/* Round Category Horizontal Menu */}
            {categories.length === 0 && !isLoading ? (
              <div className="text-center py-28 bg-gray-50 rounded-[2.5rem] text-gray-400 border border-dashed border-gray-200">
                <p className="text-lg font-bold">Không có danh mục nào cho phiên ăn này.</p>
              </div>
            ) : (
              <>
                <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-[2rem] border border-orange-100/60 shadow-sm">
                  <div className="flex gap-5 items-center overflow-x-auto scrollbar-none">
                    {/* All Category Button */}
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="flex flex-col items-center gap-2 shrink-0 group"
                    >
                      <div
                        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center ${
                          selectedCategoryId === null
                            ? "ring-3 ring-[#FF4C24] ring-offset-2 scale-105 shadow-lg shadow-orange-500/20 bg-[#FF4C24] text-white animate-bounce-subtle"
                            : "ring-1 ring-gray-200 bg-white text-gray-500 hover:ring-[#FF4C24]/50"
                        }`}
                      >
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-xs font-black whitespace-nowrap transition-colors duration-200 ${
                          selectedCategoryId === null
                            ? "text-[#FF4C24]"
                            : "text-gray-500 group-hover:text-gray-800"
                        }`}
                      >
                        Tất cả
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
                                ? "ring-3 ring-[#FF4C24] ring-offset-2 scale-105 shadow-lg shadow-orange-500/20 animate-bounce-subtle"
                                : "ring-1 ring-gray-200 hover:ring-[#FF4C24]/50"
                            }`}
                          >
                            <Image
                              src={getSafeImageUrl(category.imgUrl, "/placeholder-food.png")}
                              alt={category.name}
                              fill
                              className="object-cover rounded-full"
                              sizes="80px"
                            />
                            {cartCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 bg-[#FF4C24] text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md">
                                {cartCount}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-black whitespace-nowrap transition-colors duration-200 ${
                              isActive
                                ? "text-[#FF4C24]"
                                : "text-gray-500 group-hover:text-gray-800"
                            }`}
                          >
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Món ăn */}
                {selectedCategoryId === null ? (
                  <div className="space-y-6">
                    {categories.map((cat) => {
                      const catDishes = dishes.filter((d) => d.categoryId === cat.id);
                      if (catDishes.length === 0) return null;
                      const setting = getSettingForCategory(cat.id);
                      const cartCount = getCartCountForCategory(cat.id);
                      const catExpired = expired;
                      const notInTemplate = setting === null && selectedTemplate !== null;

                      return (
                        <div
                          key={cat.id}
                          className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 space-y-5"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3.5">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                                <Image
                                  src={getSafeImageUrl(cat.imgUrl, "/placeholder-food.png")}
                                  alt={cat.name}
                                  fill
                                  className="object-cover rounded-full"
                                  sizes="40px"
                                />
                              </div>
                              <span className="text-xl md:text-2xl font-black text-gray-900">
                                {cat.name}
                              </span>
                            </div>
                            {setting && (
                              <span
                                className={`text-xs md:text-sm font-extrabold px-4 py-2 rounded-xl border ${
                                  setting.isRequired && cartCount < setting.minQuantity
                                    ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                                    : "bg-orange-50 text-orange-600 border-orange-100"
                                }`}
                              >
                                Đã chọn: {cartCount}/{setting.maxQuantity} món
                                {setting.isRequired
                                  ? ` (Bắt buộc từ ${setting.minQuantity} món)`
                                  : " (Tùy chọn)"}
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
                            onRipple={createRipple}
                            onDragEnd={() => setIsDishDragging(false)}
                            formatPoints={formatPoints}
                            getDishQuantity={getDishQuantityInSession}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const activeCat = categories.find((c) => c.id === selectedCategoryId);
                    if (!activeCat) return null;
                    const categoryDishes = dishes.filter((d) => d.categoryId === activeCat.id);
                    if (categoryDishes.length === 0) return null;

                    const setting = getSettingForCategory(activeCat.id);
                    const cartCount = getCartCountForCategory(activeCat.id);
                    const catExpired = expired;
                    const notInTemplate = setting === null && selectedTemplate !== null;

                    return (
                      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                              <Image
                                src={getSafeImageUrl(activeCat.imgUrl, "/placeholder-food.png")}
                                alt={activeCat.name}
                                fill
                                className="object-cover rounded-full"
                                sizes="40px"
                              />
                            </div>
                            <span className="text-xl md:text-2xl font-black text-gray-900">
                              {activeCat.name}
                            </span>
                          </div>
                          {setting && (
                            <span
                              className={`text-xs md:text-sm font-extrabold px-4 py-2 rounded-xl border ${
                                setting.isRequired && cartCount < setting.minQuantity
                                  ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                              }`}
                            >
                              Đã chọn: {cartCount}/{setting.maxQuantity} món
                              {setting.isRequired
                                ? ` (Bắt buộc từ ${setting.minQuantity} món)`
                                : " (Tùy chọn)"}
                            </span>
                          )}
                        </div>
                        {catExpired && (
                          <div className="mb-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-center">
                            <span className="text-base font-bold text-red-500">
                              Phiên ăn này đã kết thúc
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
                          onRipple={createRipple}
                          onDragEnd={() => setIsDishDragging(false)}
                          formatPoints={formatPoints}
                          getDishQuantity={getDishQuantityInSession}
                        />
                      </div>
                    );
                  })()
                )}
              </>
            )}
          </div>
        </div>

        {/* ── FAB ── */}
        <button
          onClick={openCart}
          className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-[#FF4C24] text-white rounded-full shadow-[0_8px_25px_rgba(255,76,36,0.4)] flex items-center justify-center hover:bg-[#E03A12] transition-transform active:scale-95 hover:scale-105"
        >
          <ShoppingCart className="w-7 h-7" />
          {mounted && sessionCartCount > 0 && (
            <span
              ref={fabCounterRef}
              className="absolute -top-1.5 -right-1 bg-white text-[#FF4C24] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FF4C24] shadow-md"
            >
              {sessionCartCount}
            </span>
          )}
        </button>

        {isDishDragging && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDropOnTray}
              className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-dashed border-[#FF4C24] bg-white/95 px-6 py-5 text-center shadow-[0_-12px_40px_rgba(255,76,36,0.15)] backdrop-blur-md lg:hidden"
            >
              <ShoppingCart className="w-7 h-7 text-[#FF4C24] mx-auto mb-2" />
              <p className="text-base font-black text-gray-800">Thả món vào khay đặt hàng</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                Kéo lên đây — không cần kéo về mâm
              </p>
            </div>
          </>
        )}
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
  onDragEnd,
  getUrl,
  onRipple,
  formatPoints,
  dishQuantity,
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
  mealDetail: {
    name?: string;
    availableFrom?: string;
    availableTo?: string;
    isFinalized?: boolean;
  } | null;
  dragPayload: Record<string, unknown>;
  onAddToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  onDragStart: (e: React.DragEvent, data: Record<string, unknown>) => void;
  onDragEnd: () => void;
  getUrl: (url: string | null | undefined, fallback?: string) => string;
  onRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
  formatPoints: (points: number) => string;
  dishQuantity: number;
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
      onDragEnd={onDragEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        if (disabled) {
          if (notInTemplate) toast.error("Danh mục này không có trong template");
          else if (noTemplateChosen) toast.error("Chọn template để đặt món");
          else if (expired) {
            toast.error(
              mealDetail?.isFinalized ? "Phiên ăn đã được chốt đơn" : "Phiên ăn đã kết thúc",
            );
          }
          return;
        }
        onRipple(e);
        if (setting && !canAddMore) {
          toast.error(`Đã giới hạn số lượng món cho danh mục ${categoryName}`);
          return;
        }
        onAddToCart(
          {
            dishId: dragPayload.finalDishGuid as string,
            name: dish.name,
            price: dishPrice,
            imgUrl: finalImageUrl,
            description: dish.description || "Fresh select item.",
            sessionId: sessionId || undefined,
            sessionName: mealDetail?.name || undefined,
            categoryId,
            categoryName,
            sessionTime: mealDetail
              ? `${mealDetail.availableFrom} - ${mealDetail.availableTo}`
              : undefined,
          },
          1,
        );
        toast.success(`Đã thêm ${dish.name}`);
      }}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1,1,1)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "all 0.5s ease" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      className={`dish-card-customer group bg-white rounded-[2rem] border p-5 flex flex-col items-center text-center transition-all duration-300 min-h-[250px] justify-between shadow-xs ${
        disabled
          ? notInTemplate
            ? "border-gray-50 opacity-40 grayscale-[0.4]"
            : "pointer-events-none opacity-45"
          : "cursor-pointer hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] hover:border-orange-300 border-gray-100"
      }`}
    >
      <div
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shadow-lg group-hover:scale-105 transition-transform duration-300"
        style={{ transformStyle: "preserve-3d", transform: `translateZ(30px)` }}
      >
        <Image
          src={finalImageUrl}
          alt={dish.name}
          fill
          sizes="160px"
          className="object-cover rounded-full"
        />
        {dishQuantity > 0 && (
          <span className="absolute top-1 right-1 bg-[#FF4C24] text-white text-xs font-black min-w-[24px] h-6 rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-md z-10">
            x{dishQuantity}
          </span>
        )}
        {!disabled && (
          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
            <span className="bg-[#FF4C24] text-xs font-black uppercase px-4 py-2 rounded-full shadow-lg">
              + Thêm món
            </span>
          </div>
        )}
      </div>
      <div className="w-full mt-3 space-y-1.5">
        <h4 className="font-black text-gray-800 text-base sm:text-lg line-clamp-1 leading-tight group-hover:text-[#FF4C24] transition-colors">
          {dish.name}
        </h4>
        {dish.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed h-8">
            {dish.description}
          </p>
        )}
        <div className="font-black text-[#FF4C24] text-base sm:text-lg mt-1 bg-orange-50 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5">
          <span>{formatPoints(dishPrice)}</span>
          <Image
            src="/logo_point.png"
            alt="coin"
            width={18}
            height={18}
            className="object-contain"
          />
        </div>
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
  onRipple,
  onDragEnd,
  formatPoints,
  getDishQuantity,
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
  mealDetail: {
    name?: string;
    availableFrom?: string;
    availableTo?: string;
    isFinalized?: boolean;
  } | null;
  onAddToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  onDragStart: (e: React.DragEvent, data: Record<string, unknown>) => void;
  getSafeImageUrl: (url: string | null | undefined, fallback?: string) => string;
  onRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  formatPoints: (points: number) => string;
  getDishQuantity: (dishId: string) => number;
}) {
  const canAddMore = !setting || cartCount < setting.maxQuantity;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
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
            onDragEnd={onDragEnd}
            getUrl={getUrl}
            onRipple={onRipple}
            formatPoints={formatPoints}
            dishQuantity={getDishQuantity(finalDishGuid)}
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
