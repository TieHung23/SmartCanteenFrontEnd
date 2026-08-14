import React from "react";
import Image from "next/image";
import { Utensils, Smartphone, Leaf } from "lucide-react";

export default function PromoCategoriesSection() {
  return (
    <section className="w-full py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left Column: Big Saver Combo Card */}
        <div className="relative rounded-[2rem] overflow-hidden shadow-lg aspect-square lg:aspect-auto min-h-[350px] group cursor-pointer">
          <Image
            src="https://i.pinimg.com/736x/cd/6b/48/cd6b489d6a6d9bc526a2fc1395544be8.jpg"
            alt="Combo"
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>

        {/* Middle Column: 2 Stacked Cards */}
        <div className="flex flex-col gap-6">
          <div className="relative flex-1 rounded-[2rem] overflow-hidden shadow-lg group cursor-pointer aspect-video md:aspect-auto">
            <Image
              src="https://i.pinimg.com/736x/4b/52/b4/4b52b4c60e050cd077c9da42bff09ecd.jpg"
              alt="Dessert"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="relative flex-1 rounded-[2rem] overflow-hidden shadow-lg group cursor-pointer aspect-video md:aspect-auto">
            <Image
              src="https://i.pinimg.com/1200x/43/c0/83/43c083e1c4affe6969c5bd870879a833.jpg"
              alt="Meatballs"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {/* Dark gradient at bottom only to make text readable */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300">
              <span className="text-white font-bold text-lg tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
                Đặt Ngay
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Our Categories */}
        <div className="flex flex-col justify-center px-4 md:px-8 mt-8 lg:mt-0">
          <div className="mb-10">
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Tiện Ích Nổi Bật
            </h3>
            <div className="orange-motion w-16 h-1 bg-[#D35400] mt-3 rounded-full"></div>
          </div>

          <div className="flex flex-col gap-8">
            {/* Category Item 1 */}
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                <Utensils className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-gray-800 text-[15px] group-hover:text-orange-500 transition-colors">
                  Đa Dạng Thực Đơn
                </h4>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed mt-1">
                  Thực đơn thay đổi liên tục mỗi ngày
                  <br />
                  đáp ứng mọi khẩu vị của bạn.
                </p>
              </div>
            </div>

            {/* Category Item 2 */}
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-gray-800 text-[15px] group-hover:text-indigo-500 transition-colors">
                  Đặt Món Trực Tuyến
                </h4>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed mt-1">
                  Chủ động đặt suất ăn từ xa
                  <br />
                  không lo hết món, không cần chờ đợi.
                </p>
              </div>
            </div>

            {/* Category Item 3 */}
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-gray-800 text-[15px] group-hover:text-green-500 transition-colors">
                  Nguyên Liệu Tươi Sạch
                </h4>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed mt-1">
                  Đảm bảo vệ sinh an toàn thực phẩm
                  <br />
                  cho những bữa ăn ngon khỏe mỗi ngày.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
