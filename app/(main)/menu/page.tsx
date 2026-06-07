"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useCategories, useDishesForMeal } from "@/lib/hooks/useCanteen";

export default function MenuPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const { data: categoriesData, isLoading: loadingCats } = useCategories();
  const { data: dishesData, isLoading: loadingDishes } = useDishesForMeal(sessionId || "");
  const isLoading = loadingCats || loadingDishes;

  // XỬ LÝ EDGE CASE: User truy cập thẳng vào /menu mà chưa có sessionId
  if (!sessionId) {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FDFBF9] px-4">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-5xl shadow-sm">
            🍽️
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            No Session Selected
          </h1>
          <p className="text-gray-500 mb-8 text-center max-w-md text-base leading-relaxed">
            It looks like you haven&apos;t chosen a meal session yet. Please select a session to
            view the available menu.
          </p>
          <Link
            href="/session"
            className="bg-[#D35400] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#B34700] transition-colors shadow-lg shadow-orange-500/30 flex items-center gap-2"
          >
            <svg
              width="20"
              height="20"
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
  const dishes = dishesData?.items || [];

  const sortedCategories = [...categories].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    const isAStarch = nameA.includes("starch") || nameA.includes("tinh bột");
    const isBStarch = nameB.includes("starch") || nameB.includes("tinh bột");

    if (isAStarch && !isBStarch) return -1;
    if (!isAStarch && isBStarch) return 1;

    const isAMain = nameA.includes("main") || nameA.includes("món chính");
    const isBMain = nameB.includes("main") || nameB.includes("món chính");
    if (isAMain && !isBMain) return -1;
    if (!isAMain && isBMain) return 1;

    return 0;
  });

  const categoryIconMap: Record<string, string> = {
    breakfasts: "/breakfast.png",
    lunches: "/lunch.png",
    dinner: "/dinner.png",
    desserts: "/dessert.png",
    sides: "/side-dish.png",
    vegan: "/vegan.png",
    "tinh bột": "/lunch.png",
    "món chính": "/lunch.png",
    "món phụ": "/side-dish.png",
    "tráng miệng": "/dessert.png",
  };

  const navItems = [
    { id: "all", name: "All", isAll: true },
    ...sortedCategories.map((c) => ({ ...c, isAll: false })),
  ];
  const marqueeItems = [...navItems, ...navItems];

  // Hàm cuộn mượt mà
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
      <main className="min-h-screen bg-[#FDFBF9] pb-24 font-sans overflow-x-hidden">
        <div className="w-full bg-white border-b border-gray-100 pt-8 pb-16 md:pt-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 text-center md:text-left z-10">
              <Link
                href="/session"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
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
                Back to Sessions
              </Link>

              <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-extrabold text-gray-900 tracking-tight mb-6 leading-[1.1]">
                Design Your <br className="hidden md:block" />
                <span className="text-[#D35400]">Perfect Tray</span>
              </h1>

              <p className="text-gray-500 font-medium text-base md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed">
                Explore fresh ingredients, balance your nutrition, and craft a delicious meal
                tailored to your daily goals.
              </p>
            </div>

            <div className="flex-1 w-full mt-14 md:mt-0 flex justify-center md:justify-end relative">
              <div className="relative w-56 h-56 md:w-80 md:h-80 animate-[floatCenter_6s_ease-in-out_infinite]">
                <Image
                  src="/chef_hat.png" // Đổi thành hình đĩa thức ăn đẹp của bạn
                  alt="Delicious Meal"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] py-4 sticky top-0 bg-white/95 backdrop-blur-md z-40 overflow-hidden flex">
          <div className="animate-marquee hover:[animation-play-state:paused] flex items-center gap-10 md:gap-16 px-4">
            {marqueeItems.map((item, index) => {
              const iconPath = item.isAll
                ? "/globe.svg"
                : categoryIconMap[item.name.toLowerCase()] || "/file.svg";

              return (
                <button
                  key={`nav-${item.id}-${index}`}
                  onClick={() => scrollToCategory(item.id)}
                  className="flex flex-col items-center gap-2 group cursor-pointer hover:-translate-y-1 transition-transform min-w-[80px]"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm border border-transparent group-hover:border-orange-100 ${item.isAll ? "bg-[#FFF3EB]" : "bg-gray-50 group-hover:bg-[#FFF3EB]"}`}
                  >
                    <Image
                      src={iconPath}
                      alt={item.name}
                      width={26}
                      height={26}
                      className={`${item.isAll ? "opacity-100" : "opacity-60"} group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${item.isAll ? "text-[#D35400]" : "text-gray-500 group-hover:text-[#D35400]"}`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-16 mb-8 text-center relative z-20">
          <h2 className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-[0.3em] mb-10">
            Your Setup
          </h2>

          <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500">
            <Image
              src="/tray.png"
              alt="Empty Canteen Tray"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 mt-20">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35400]"></div>
            </div>
          ) : (
            <div className="space-y-24">
              {sortedCategories.map((category) => {
                const categoryDishes = dishes.filter((dish) => dish.categoryId === category.id);

                if (categoryDishes.length === 0) return null;
                const iconPath = categoryIconMap[category.name.toLowerCase()] || "/file.svg";

                return (
                  <div
                    key={`section-${category.id}`}
                    id={`category-${category.id}`}
                    className="w-full"
                  >
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-12 border-b border-gray-100 pb-4">
                      <Image
                        src={iconPath}
                        alt={category.name}
                        width={36}
                        height={36}
                        className="object-contain opacity-90"
                      />
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 capitalize tracking-tight m-0">
                        <span className="font-normal text-gray-400 mr-2">Choose your</span>
                        <strong className="text-[#D35400]">{category.name.toLowerCase()}</strong>
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-16 gap-x-8 md:gap-x-12 lg:gap-x-16 justify-items-center">
                      {categoryDishes.map(
                        (dish: {
                          id: string;
                          name: string;
                          price: number;
                          imageUrl?: string;
                          categoryId: string;
                        }) => (
                          <div
                            key={dish.id}
                            className="flex flex-col items-center group cursor-pointer w-full max-w-[180px]"
                          >
                            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-2 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 group-hover:border-orange-200 group-hover:shadow-[0_8px_30px_rgba(211,84,0,0.12)] transition-all duration-300 transform group-hover:-translate-y-3 overflow-hidden">
                              <Image
                                src={dish.imageUrl || "/placeholder-food.png"}
                                alt={dish.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw" // Thêm sizes để tối ưu hiệu suất và tránh warning
                                className="object-cover rounded-full p-1.5"
                              />
                            </div>

                            <p className="mt-5 text-center font-bold text-gray-800 group-hover:text-[#D35400] transition-colors line-clamp-2 px-2 text-base md:text-lg">
                              {dish.name}
                            </p>

                            <div className="mt-3 text-center bg-gray-50 px-5 py-1.5 rounded-full group-hover:bg-[#D35400] transition-colors duration-300 border border-gray-100 group-hover:border-transparent">
                              <p className="font-bold text-[#D35400] group-hover:text-white text-sm md:text-base">
                                {dish.price} <span className="font-medium opacity-70">điểm</span>
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatCenter {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
      `,
        }}
      />
    </>
  );
}
