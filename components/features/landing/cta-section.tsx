import React from "react";
import Image from "next/image";
import { ShoppingBag, Wallet } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="w-full py-16 px-4 md:px-8 mt-12 mb-20 relative overflow-hidden">
      {/* Background soft color matching the design */}
      <div className="absolute inset-0 bg-white -z-10 w-screen left-1/2 -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24 relative">
        {/* Left Content */}
        <div className="flex-1 flex flex-col gap-5 max-w-xl z-10">
          <span className="text-[#D35400] font-bold tracking-widest text-xs uppercase flex items-center gap-2">
            SMART CANTEEN
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-tight tracking-tight">
            Bắt Đầu Trải Nghiệm Ngay!
          </h2>
          {/* Decorative short orange line */}
          <div className="orange-motion w-16 h-1 bg-[#D35400] rounded-full mt-1 mb-2"></div>

          <h3 className="text-xl font-black text-gray-800 leading-snug">
            Giải pháp hoàn hảo để đặt suất ăn nhanh chóng và tiện lợi tại căn tin.
          </h3>
          <p className="text-gray-500 font-medium text-[13px] leading-relaxed mb-4">
            Hệ thống quản lý suất ăn thông minh giúp bạn dễ dàng theo dõi thực đơn hàng ngày, đặt
            trước món yêu thích và quản lý chi tiêu ăn uống một cách tiện lợi, minh bạch nhất.
          </p>

          {/* 2 Feature Cards */}
          <div className="flex flex-col sm:flex-row gap-6 mt-2">
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-teal-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-black text-gray-900 text-sm">Đặt Món Trực Tuyến</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Chủ động chọn món và thanh toán trước, tạm biệt cảnh xếp hàng chờ đợi mỗi giờ nghỉ
                  trưa.
                </p>
              </div>
            </div>
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Wallet className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-black text-gray-900 text-sm">Quản Lý Chi Tiêu</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Lịch sử giao dịch được lưu trữ rõ ràng, giúp bạn dễ dàng theo dõi và kiểm soát
                  ngân sách.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="flex-1 relative flex justify-center lg:justify-end w-full mt-12 md:mt-0">
          {/* Big Yellow Circle */}
          <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] bg-[#ffe45c] rounded-full shadow-2xl mt-12 md:mt-0">
            <div
              aria-hidden="true"
              className="feature-dashed-ring absolute -inset-6 md:-inset-10 z-0 rounded-full pointer-events-none"
            />

            {/* Layer 1: Base Image perfectly clipped to the yellow circle */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-[500px] md:h-[700px] pointer-events-none">
                <Image
                  src="/girl-eating-corn.png"
                  alt="Girl eating corn base"
                  fill
                  className="object-contain object-bottom relative z-10 pointer-events-auto"
                />
              </div>
            </div>

            {/* Layer 2: Head pop-out, clipped to only show the top-center part */}
            <div
              className="absolute bottom-0 left-0 w-full h-[500px] md:h-[700px] pointer-events-none z-20"
              style={{ clipPath: "inset(0 18% 40% 18%)" }}
            >
              <Image
                src="/girl-eating-corn.png"
                alt="Girl eating corn head"
                fill
                className="object-contain object-bottom relative pointer-events-auto"
              />
            </div>

            {/* Floating Fries Icon Top Right */}
            <div className="hidden">
              <span className="text-4xl">🍟</span>
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-[10px]">❤️</span>
              </div>
            </div>

            {/* Floating Fries Icon Bottom Left */}
            <div className="hidden">
              <span className="text-3xl">🍟</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
