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
import { ShoppingCart, ChevronRight, Layers, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";

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

  const { addToCart, setMealId, cartItems, getCartTotal, getCartCount } = useCart();
  const isLoading = loadingCats || loadingDishes || loadingMeal;

  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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
    setIsDragging(true);
    setDragStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
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

  const getSettingForCategory = (categoryId: string) => {
    return selectedTemplate?.settings.find((s) => s.categoryId === categoryId) || null;
  };

  const getCartCountForCategory = (categoryId: string) => {
    const categoryDishIds = new Set(
      dishes.filter((d) => d.categoryId === categoryId).map((d) => d.id),
    );
    return cartItems
      .filter((item) => categoryDishIds.has(item.dishId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

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
        <div className="w-full bg-white border-b border-gray-50 pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 text-center md:text-left z-10">
              <Link
                href="/session"
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-4 tracking-wide uppercase"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Sessions
              </Link>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15]">
                {mealDetail?.name || "Loading..."}
              </h1>
              <p className="text-gray-400 font-medium text-sm mt-2 leading-relaxed max-w-lg">
                {selectedTemplate
                  ? `Selected: ${selectedTemplate.name}`
                  : "Choose a meal template below, then pick your dishes."}
              </p>
            </div>
            <div className="flex-1 w-full mt-6 md:mt-0 flex justify-center md:justify-end">
              <div className="relative w-36 h-36 md:w-48 md:h-48 animate-[floatCenter_6s_ease-in-out_infinite]">
                <Image
                  src="/chef_hat.png"
                  alt="Canteen Concept"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-5">
              {/* Sessions */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Sessions
                </h3>
                <div className="space-y-1">
                  {(allMeals?.items || []).slice(0, 8).map((m) => (
                    <Link
                      key={m.id}
                      href={`/menu?sessionId=${m.id}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        m.id === sessionId
                          ? "bg-orange-50 text-[#D35400]"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${m.id === sessionId ? "bg-[#D35400]" : "bg-gray-200"}`}
                      />
                      <span className="truncate">{m.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {selectedTemplate && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {categories.map((c) => {
                      const setting = getSettingForCategory(c.id);
                      const count = getCartCountForCategory(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            const el = document.getElementById(`category-${c.id}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                          <span className="truncate">{c.name}</span>
                          {setting && (
                            <span className="text-[10px] text-gray-400">
                              {count}/{setting.maxQuantity}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cart Summary */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-[#D35400]" />
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cart
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-gray-800">{getCartCount()}</span> items
                  {" · "}
                  <span className="font-bold text-[#D35400]">{getCartTotal()}</span> pts
                </p>
                {cartItems.length > 0 && (
                  <Link
                    href={ROUTES.CHECKOUT}
                    className="mt-3 flex items-center justify-center gap-1 w-full py-2 bg-[#D35400] text-white text-[11px] font-bold rounded-lg hover:bg-[#B34700] transition-all"
                  >
                    Checkout <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Meal Template Carousel */}
            {templates.length > 0 && (
              <div className="mt-8 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[#D35400]" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Meal Templates
                  </h2>
                  {selectedTemplate && (
                    <button
                      onClick={() => setSelectedTemplateIdx(null)}
                      className="ml-auto text-[10px] font-bold text-[#D35400] hover:text-[#B34700]"
                    >
                      Show All
                    </button>
                  )}
                </div>
                <div
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="flex gap-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-2 select-none"
                  style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
                >
                  {templates.map((t, idx) => {
                    const isActive = selectedTemplateIdx === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTemplateIdx(isActive ? null : idx)}
                        className={`shrink-0 px-5 py-3 rounded-xl text-sm font-bold transition-all border-2 whitespace-nowrap ${
                          isActive
                            ? "bg-[#D35400] text-white border-[#D35400] shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-[#D35400]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isActive && <CheckCircle2 className="w-4 h-4" />}
                          {t.name}
                        </div>
                        <div className="text-[9px] font-normal mt-0.5 opacity-60">
                          {t.settings.length} categories
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tray Image */}
            {!selectedTemplate && (
              <div className="max-w-xl mx-auto mt-8 mb-4 text-center">
                <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.35em] mb-4">
                  Your Tray
                </h2>
                <div className="relative w-full max-w-xs mx-auto aspect-[4/3] drop-shadow-xl">
                  <Image
                    src="/tray.png"
                    alt="Empty Canteen Tray"
                    fill
                    className="object-contain"
                    priority
                    sizes="300px"
                  />
                </div>
              </div>
            )}

            {/* Dishes */}
            <div className="mt-10">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]" />
                </div>
              ) : (
                <div className="space-y-16">
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
                        className="w-full scroll-mt-28"
                      >
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Image
                                src={getSafeImageUrl(category.imgUrl, "/file.svg")}
                                alt={category.name}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">
                              <span className="font-normal text-gray-400">Choose your </span>
                              <span className="text-[#D35400]">{category.name}</span>
                            </h3>
                          </div>
                          {setting && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">
                                {setting.isRequired ? "Required" : "Optional"}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold ${
                                  cartCount >= setting.maxQuantity
                                    ? "bg-orange-100 text-[#D35400]"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {cartCount}/{setting.maxQuantity}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-6 justify-items-center">
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
                                  `Maximum ${setting.maxQuantity} dishes for ${category.name}`,
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
                                },
                                1,
                              );
                            };

                            return (
                              <div
                                key={dish.id}
                                onClick={handleDishClick}
                                className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[160px]"
                              >
                                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full p-1.5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 group-hover:border-orange-400 group-hover:shadow-[0_10px_30px_rgba(211,84,0,0.12)] transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden">
                                  <Image
                                    src={finalImageUrl}
                                    alt={dish.name}
                                    fill
                                    sizes="144px"
                                    className="object-cover rounded-full p-1 shadow-inner"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                                    <span className="text-white font-black text-[10px] uppercase tracking-wider bg-[#D35400] px-3 py-1.5 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-md">
                                      + Add to Tray
                                    </span>
                                  </div>
                                </div>

                                <h4 className="mt-3 font-bold text-gray-800 group-hover:text-[#D35400] transition-colors text-sm line-clamp-1 px-1">
                                  {dish.name}
                                </h4>

                                <p className="mt-1 text-[10px] text-gray-400 line-clamp-2 min-h-[28px] leading-relaxed px-2 opacity-85">
                                  {dish.description || "No description"}
                                </p>

                                <div className="mt-2 bg-gray-50 group-hover:bg-[#D35400] px-3 py-1 rounded-full border border-gray-100 group-hover:border-transparent transition-all duration-300">
                                  <p className="font-extrabold text-[#D35400] group-hover:text-white text-xs m-0 tracking-wide">
                                    {dishPrice}{" "}
                                    <span className="font-medium opacity-75 text-[10px]">pts</span>
                                  </p>
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
      </main>

      {/* Mobile cart bar */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#D35400]" />
            <span className="text-sm font-bold text-gray-800">
              {getCartCount()} items · {getCartTotal()} pts
            </span>
          </div>
          <Link
            href={ROUTES.CHECKOUT}
            className="px-5 py-2.5 bg-[#D35400] text-white text-sm font-bold rounded-xl hover:bg-[#B34700] transition-all flex items-center gap-1"
          >
            Checkout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatCenter { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
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
