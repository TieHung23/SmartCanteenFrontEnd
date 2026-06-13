"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { useCategories, useMealDetail, useAllDishes } from "@/lib/hooks/useCanteen";
import type { Dish } from "@/types/dish.types";
// 📢 1. Khai thác sức mạnh lưu trữ từ CartContext toàn cục
import { useCart } from "@/context/cart-context";

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

  // 📢 2. Bóc tách các hàm tương tác giỏ hàng ra xài
  const { addToCart, setMealId } = useCart();
  const isLoading = loadingCats || loadingDishes || loadingMeal;

  // ✅ FIX LỖI CÚ PHÁP: Đồng bộ mã Session làm MealID đặt đơn chuẩn .NET Backend
  useEffect(() => {
    if (sessionId) {
      setMealId(sessionId);
    }
  }, [sessionId, setMealId]); // Đã đóng đầy đủ dấu ngoặc nhọn và ngoặc tròn ở đây!

  const dishes = useMemo(() => {
    if (!allDishesData?.items) return [];

    if (mealDetail?.dishes && mealDetail.dishes.length > 0) {
      const allowedDishIds = new Set(mealDetail.dishes.map((d: { dishId: string }) => d.dishId));
      return allDishesData.items.filter((dish: Dish) => allowedDishIds.has(dish.id));
    }

    return allDishesData.items;
  }, [mealDetail, allDishesData]);

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

  const categories = categoriesData?.items || [];

  const navItems = [
    { id: "all", name: "All", isAll: true, imgUrl: "/globe.svg" },
    ...categories.map((c) => ({ ...c, isAll: false })),
  ];
  const marqueeItems = [...navItems, ...navItems];

  const scrollToCategory = (categoryId: string) => {
    if (categoryId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] pb-32 font-sans overflow-x-hidden">
        <div className="w-full bg-white border-b border-gray-50 pt-10 pb-16 md:pt-16 md:pb-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 text-center md:text-left z-10">
              <Link
                href="/session"
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6 tracking-wide uppercase"
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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-5 leading-[1.15]">
                Design Your <br className="hidden md:block" />
                <span className="text-[#D35400]">Perfect Tray</span>
              </h1>
              <p className="text-gray-400 font-medium text-sm md:text-base leading-relaxed">
                Active Session:{" "}
                <strong className="text-gray-700 font-semibold">
                  {mealDetail?.name || "Loading..."}
                </strong>{" "}
                <br />
                Explore fresh ingredients, balance your nutrition, and craft a delicious meal
                tailored to your daily goals.
              </p>
            </div>
            <div className="flex-1 w-full mt-10 md:mt-0 flex justify-center md:justify-end relative">
              <div className="relative w-48 h-48 md:w-64 md:h-64 animate-[floatCenter_6s_ease-in-out_infinite]">
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

        <div className="w-full border-b border-gray-100 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.02)] py-3.5 sticky top-0 bg-white/90 backdrop-blur-lg z-40 overflow-hidden flex">
          <div className="animate-marquee hover:[animation-play-state:paused] flex items-center gap-12 md:gap-16 px-4">
            {marqueeItems.map((item, index) => {
              const iconPath = item.isAll
                ? "/globe.svg"
                : getSafeImageUrl(item.imgUrl, "/file.svg");
              return (
                <button
                  key={`nav-${item.id}-${index}`}
                  onClick={() => scrollToCategory(item.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer transition-all min-w-[75px]"
                >
                  <div
                    className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all border ${item.isAll ? "bg-[#FFF3EB] border-orange-100/50 shadow-sm" : "bg-gray-50 border-gray-100 group-hover:bg-[#FFF3EB] group-hover:border-orange-100"}`}
                  >
                    <Image
                      src={iconPath}
                      alt={item.name}
                      width={item.isAll ? 22 : 48}
                      height={item.isAll ? 22 : 48}
                      className={
                        item.isAll
                          ? "object-contain"
                          : "object-cover w-full h-full transition-opacity opacity-80 group-hover:opacity-100"
                      }
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#D35400] transition-colors">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-6 mt-16 mb-6 text-center relative z-20">
          <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.35em] mb-6">
            Tray Configuration
          </h2>
          <div className="relative w-full max-w-lg mx-auto aspect-[4/3] drop-shadow-xl hover:scale-[1.01] transition-transform duration-500">
            <Image
              src="/tray.png"
              alt="Empty Canteen Tray"
              fill
              className="object-contain"
              priority
              sizes="450px"
            />
          </div>
        </div>

        <div className="w-full max-w-[1500px] mx-auto px-6 md:px-12 mt-16">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]"></div>
            </div>
          ) : (
            <div className="space-y-24">
              {categories.map((category) => {
                const categoryDishes = dishes.filter((d) => d.categoryId === category.id);
                if (categoryDishes.length === 0) return null;
                const categoryHeaderIcon = getSafeImageUrl(category.imgUrl, "/file.svg");

                return (
                  <div
                    key={`section-${category.id}`}
                    id={`category-${category.id}`}
                    className="w-full scroll-mt-28"
                  >
                    <div className="flex items-center justify-center md:justify-start gap-3.5 mb-10 border-b border-gray-100 pb-3.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Image
                          src={categoryHeaderIcon}
                          alt={category.name}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight m-0 font-sans flex items-center gap-1.5">
                        <span className="font-normal text-gray-400">Choose your</span>
                        <span className="text-[#D35400] font-extrabold">{category.name}</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-12 gap-x-8 justify-items-center">
                      {categoryDishes.map(
                        (
                          dish: Dish & { priceAmount?: number; price?: number; dishId?: string },
                        ) => {
                          const finalImageUrl = getSafeImageUrl(dish.imgUrl);
                          const dishPrice = dish.priceAmount ?? dish.price ?? 0;

                          // 📢 SỬA ĐOẠN NÀY: Tìm chính xác ID khớp với cấu trúc liên kết Session trong DB
                          // Nếu đối tượng dish có trường dishId (từ mealDetail) thì ưu tiên lấy, không thì fallback về dish.id
                          const finalDishGuid = dish.dishId || dish.id;

                          const handleDishClick = () => {
                            console.log("👉 [ACTION ADD TO TRAY] - ID gửi đi:", finalDishGuid);

                            addToCart(
                              {
                                dishId: finalDishGuid, // ✅ Đã bốc đúng mã ID liên kết khớp cột 1 trong DB của Nhi
                                name: dish.name,
                                price: dishPrice,
                                imgUrl: finalImageUrl,
                                description: dish.description || "Fresh canteen select item.",
                              },
                              1,
                            ); // Mặc định chạm đĩa đồ ăn tự động tăng 1 số lượng
                          };

                          return (
                            <div
                              key={dish.id}
                              onClick={handleDishClick} // 📢 Kích hoạt sự kiện click một chạm trượt Drawer
                              className="flex flex-col items-center text-center group cursor-pointer w-full max-w-[170px]"
                            >
                              {/* Khung đĩa tròn thức ăn có tích hợp hiệu ứng hover */}
                              <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full p-1.5 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 group-hover:border-orange-400 group-hover:shadow-[0_10px_30px_rgba(211,84,0,0.12)] transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden">
                                <Image
                                  src={finalImageUrl}
                                  alt={dish.name}
                                  fill
                                  sizes="160px"
                                  className="object-cover rounded-full p-1 shadow-inner"
                                />

                                {/* UI HIỆU ỨNG: Lớp phủ mờ hiện chữ khi di chuột vào đĩa đồ ăn */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                                  <span className="text-white font-black text-[11px] uppercase tracking-wider bg-[#D35400] px-3 py-1.5 rounded-full scale-90 group-hover:scale-100 transition-transform shadow-md">
                                    + Add to Tray
                                  </span>
                                </div>
                              </div>

                              <h4 className="mt-4 font-bold text-gray-800 group-hover:text-[#D35400] transition-colors text-sm md:text-base line-clamp-1 font-sans px-1">
                                {dish.name}
                              </h4>

                              <p className="mt-1 text-[11px] text-gray-400 line-clamp-2 min-h-[32px] leading-relaxed font-sans px-2 opacity-85">
                                {dish.description ||
                                  "No description provided for this specific item."}
                              </p>

                              <div className="mt-2.5 bg-gray-50 group-hover:bg-[#D35400] px-4 py-1 rounded-full border border-gray-100 group-hover:border-transparent transition-all duration-300">
                                <p className="font-extrabold text-[#D35400] group-hover:text-white text-xs m-0 font-sans tracking-wide">
                                  {dishPrice}{" "}
                                  <span className="font-medium opacity-75 text-[10px]">pts</span>
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D35400]"></div>
        </div>
      }
    >
      <MenuContent />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatCenter { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      `,
        }}
      />
    </Suspense>
  );
}
