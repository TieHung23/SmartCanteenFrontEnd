"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useEffect, useState, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import { useCategories, useMealDetail, useAllDishes } from "@/lib/hooks/useCanteen";
import { useMeals } from "@/lib/hooks/useMeals";
import type { MealTemplate } from "@/types/meal.types";
import { useCart } from "@/context/cart-context";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import {
  ShoppingCart,
  ChevronRight,
  Layers,
  CheckCircle2,
  X,
  Clock,
  Trash2,
  Minus,
  Plus,
  UtensilsCrossed,
} from "lucide-react";

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

function MenuContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const { data: categoriesData, isLoading: loadingCats } = useCategories();
  const { data: allDishesData, isLoading: loadingDishes } = useAllDishes();
  const { data: mealDetail, isLoading: loadingMeal } = useMealDetail(sessionId);
  const { data: allMeals } = useMeals(true);

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeftAmt, setScrollLeftAmt] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevSessionId = useRef(sessionId);

  useEffect(() => {
    if (sessionId) {
      setMealId(sessionId);
      if (prevSessionId.current !== sessionId) {
        setSelectedTemplateIdx(null);
        prevSessionId.current = sessionId;
      }
    }
  }, [sessionId, setMealId]);

  // Close drawer on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && isCartOpen) {
        closeCart();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCartOpen, closeCart]);

  // Auto-scroll carousel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || selectedTemplateIdx !== null) return;
    const interval = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 1, behavior: "smooth" });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [selectedTemplateIdx]);

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
    selectedTemplate?.settings.find((s) => s.categoryId === categoryId) || null;

  const getCartCountForCategory = (categoryId: string) => {
    const catDishIds = new Set(dishes.filter((d) => d.categoryId === categoryId).map((d) => d.id));
    return cartItems
      .filter((item) => catDishIds.has(item.dishId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Group cart items by session
  const cartBySession = useMemo(() => {
    const groups: Record<string, { mealName: string; items: typeof cartItems }> = {};
    cartItems.forEach((item) => {
      const key = item.mealId || "current";
      if (!groups[key])
        groups[key] = {
          mealName: item.mealName || mealDetail?.name || "Current Session",
          items: [],
        };
      groups[key].items.push(item);
    });
    return groups;
  }, [cartItems, mealDetail]);

  if (!sessionId) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FDFBF9] px-4">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-4xl shadow-sm">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            No Session Selected
          </h1>
          <p className="text-gray-400 mb-8 text-center max-w-sm text-sm leading-relaxed">
            Please choose an active meal session from the dashboard to explore the tailored menu
            setup.
          </p>
          <Link
            href="/session"
            className="bg-[#D35400] text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-[#B34700] transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Go to Sessions
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] pb-32 font-sans overflow-x-hidden">
        {/* Hero */}
        <div className="w-full bg-white border-b border-gray-100 pt-8 pb-10 md:pt-10 md:pb-14">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 text-center md:text-left z-10">
              <Link
                href="/session"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-3 tracking-wide uppercase"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Sessions
              </Link>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {mealDetail?.name || "Loading..."}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                {mealDetail?.availableFrom && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Clock className="w-3 h-3" />
                    {new Date(mealDetail.availableFrom).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(mealDetail.availableTo).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {selectedTemplate && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D35400] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    <Layers className="w-3 h-3" />
                    {selectedTemplate.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 w-full mt-6 md:mt-0 flex justify-center md:justify-end">
              <div className="relative w-28 h-28 md:w-36 md:h-36 animate-[floatCenter_6s_ease-in-out_infinite]">
                <Image
                  src="/chef_hat.png"
                  alt="Canteen"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex gap-8">
          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Current session + other sessions */}
              <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3 h-3" /> Sessions
                </h3>
                <div className="space-y-0.5">
                  {(allMeals?.items || []).slice(0, 6).map((m) => (
                    <Link
                      key={m.id}
                      href={`/menu?sessionId=${m.id}`}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        m.id === sessionId
                          ? "bg-orange-50 text-[#D35400]"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.id === sessionId ? "bg-[#D35400]" : "bg-gray-200"}`}
                      />
                      <span className="truncate">{m.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {/* Categories in selected template */}
              {selectedTemplate && (
                <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    Categories
                  </h3>
                  <div className="space-y-0.5">
                    {categories.map((c) => {
                      const setting = getSettingForCategory(c.id);
                      const count = getCartCountForCategory(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            document
                              .getElementById(`category-${c.id}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                          <span className="truncate">{c.name}</span>
                          {setting && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                count >= setting.maxQuantity
                                  ? "bg-orange-100 text-[#D35400]"
                                  : "text-gray-400"
                              }`}
                            >
                              {count}/{setting.maxQuantity}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Meal Template Carousel */}
            {templates.length > 0 && (
              <div className="mt-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#D35400]" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Templates
                  </h2>
                  <button
                    onClick={() => setSelectedTemplateIdx(null)}
                    className={`ml-auto text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                      selectedTemplate
                        ? "text-[#D35400] bg-orange-50 hover:bg-orange-100"
                        : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {selectedTemplate ? "Clear" : "All"}
                  </button>
                </div>
                <div
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="flex gap-2.5 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-2 select-none"
                  style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
                >
                  {templates.map((t, idx) => {
                    const isActive = selectedTemplateIdx === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTemplateIdx(isActive ? null : idx)}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 whitespace-nowrap ${
                          isActive
                            ? "bg-[#D35400] text-white border-[#D35400] shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-[#D35400]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {t.name}
                        </div>
                        <div className="text-[9px] font-medium mt-0.5 opacity-50">
                          {t.settings.length} categories
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tray image (when no template selected) */}
            {!selectedTemplate && (
              <div className="max-w-sm mx-auto mt-6 mb-6 text-center">
                <div className="relative w-full max-w-[200px] mx-auto aspect-[4/3] drop-shadow-md opacity-60">
                  <Image
                    src="/tray.png"
                    alt="Tray"
                    fill
                    className="object-contain"
                    priority
                    sizes="200px"
                  />
                </div>
                <p className="text-[10px] text-gray-300 font-bold tracking-[0.3em] uppercase mt-2">
                  Select a template to begin
                </p>
              </div>
            )}

            {/* Dishes grid */}
            <div className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
                </div>
              ) : (
                <div className="space-y-10">
                  {categories.map((category) => {
                    const categoryDishes = dishes.filter((d) => d.categoryId === category.id);
                    if (categoryDishes.length === 0) return null;
                    const setting = getSettingForCategory(category.id);
                    const cartCount = getCartCountForCategory(category.id);
                    const canAddMore = !setting || cartCount < setting.maxQuantity;

                    return (
                      <div
                        key={`section-${category.id}`}
                        id={`category-${category.id}`}
                        className="w-full scroll-mt-24"
                      >
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Image
                                src={getSafeImageUrl(category.imgUrl, "/file.svg")}
                                alt={category.name}
                                width={24}
                                height={24}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">
                              <span className="font-normal text-gray-400">Chọn </span>
                              <span className="text-[#D35400]">{category.name}</span>
                            </h3>
                          </div>
                          {setting && (
                            <div
                              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cartCount >= setting.maxQuantity
                                  ? "bg-orange-50 text-[#D35400] border border-orange-100"
                                  : "bg-gray-50 text-gray-400 border border-gray-100"
                              }`}
                            >
                              {setting.isRequired ? "Bắt buộc" : "Tùy chọn"}
                              <span className="ml-1">
                                {cartCount}/{setting.maxQuantity}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {categoryDishes.map((dish) => {
                            const finalImageUrl = getSafeImageUrl(dish.imgUrl);
                            const dishPrice =
                              (dish as { priceAmount?: number; price?: number }).priceAmount ??
                              (dish as { price?: number }).price ??
                              0;
                            const finalDishGuid = (dish as { dishId?: string }).dishId || dish.id;

                            const handleDishClick = () => {
                              if (setting && !canAddMore) {
                                toast.error(
                                  `Max ${setting.maxQuantity} dishes for ${category.name}`,
                                );
                                return;
                              }
                              addToCart(
                                {
                                  dishId: finalDishGuid,
                                  name: dish.name,
                                  price: dishPrice,
                                  imgUrl: finalImageUrl,
                                  description: dish.description || "Fresh canteen select item.",
                                  mealId: sessionId || undefined,
                                  mealName: mealDetail?.name || undefined,
                                },
                                1,
                              );
                            };

                            return (
                              <div
                                key={dish.id}
                                onClick={handleDishClick}
                                className="group cursor-pointer bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-[0_8px_25px_rgba(211,84,0,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                              >
                                <div className="relative w-full aspect-square bg-gray-50">
                                  <Image
                                    src={finalImageUrl}
                                    alt={dish.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white font-black text-[10px] uppercase tracking-wider bg-[#D35400] px-3 py-1.5 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                      + Add
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2.5">
                                  <h4 className="font-extrabold text-gray-800 group-hover:text-[#D35400] transition-colors text-[11px] leading-tight line-clamp-2 min-h-[2em]">
                                    {dish.name}
                                  </h4>
                                  <div className="mt-1.5 flex items-center justify-between">
                                    <span className="font-black text-[#D35400] text-xs">
                                      {dishPrice}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400">pts</span>
                                  </div>
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
            </div>
          </div>
        </div>

        {/* Cart FAB - mobile */}
        <button
          onClick={openCart}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#D35400] text-white rounded-full shadow-[0_6px_25px_rgba(211,84,0,0.35)] flex items-center justify-center hover:bg-[#B34700] transition-all active:scale-90"
        >
          <ShoppingCart className="w-6 h-6" />
          {getCartCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[#D35400] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#D35400]">
              {getCartCount()}
            </span>
          )}
        </button>

        {/* Slide-out Cart Drawer */}
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
              isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
              isCartOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#D35400]" />
                <h2 className="text-base font-extrabold text-gray-800">Your Cart</h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {getCartCount()} items
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-140px)] p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">Cart is empty</p>
                  <p className="text-xs text-gray-300 mt-1">Click a dish to add it.</p>
                </div>
              ) : (
                Object.entries(cartBySession).map(([key, group]) => (
                  <div key={key}>
                    <h3 className="text-[10px] font-bold text-[#D35400] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3 h-3" />
                      {group.mealName}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div
                          key={item.dishId}
                          className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={item.imgUrl || "/placeholder-food.png"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                            <p className="text-[10px] font-bold text-[#D35400]">{item.price} pts</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                              className="p-1 rounded-md text-gray-400 hover:bg-white hover:text-[#D35400] transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-gray-700">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                              className="p-1 rounded-md text-gray-400 hover:bg-white hover:text-[#D35400] transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.dishId)}
                              className="p-1 rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-black text-[#D35400]">{getCartTotal()} pts</span>
              </div>
              <Link
                href={ROUTES.CHECKOUT}
                onClick={closeCart}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
              >
                Checkout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatCenter { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      `,
        }}
      />
    </>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
