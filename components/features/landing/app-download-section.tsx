import React from "react";
import Image from "next/image";

export default function AppDownloadSection() {
  return (
    <section className="w-full bg-[#FFF3EB] py-16 px-4 md:px-8 mt-12 mb-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Content */}
        <div className="flex-1 flex flex-col gap-6 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-black text-[#D35400] leading-tight tracking-tight">
            Trải Nghiệm Tiện Lợi Hơn
          </h2>
          <p className="text-gray-700 font-medium text-base leading-relaxed">
            Sử dụng cực kỳ nhanh chóng và tiện lợi với ứng dụng Smart Canteen trên điện thoại. Đặt
            món mọi lúc, mọi nơi!
          </p>

          {/* Download Buttons */}
          <div className="flex flex-row flex-wrap gap-4 mt-2">
            <button className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg">
              <svg className="w-6 h-6 text-[#3DDC84] fill-current" viewBox="0 0 512 512">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-semibold text-gray-300 tracking-wider">
                  GET IT ON
                </span>
                <span className="text-sm font-bold -mt-0.5">Google Play</span>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg">
              <svg className="w-6 h-6 text-white fill-current mb-1" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-semibold text-gray-300 tracking-wider">
                  Download on the
                </span>
                <span className="text-sm font-bold -mt-0.5">App Store</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Phone Mockups */}
        <div className="flex-1 flex justify-center lg:justify-end relative h-[500px]">
          {/* Phone 2 (Behind, rotated) */}
          <div className="absolute right-[5%] top-10 w-[240px] h-[480px] bg-zinc-900 rounded-[2.5rem] p-1.5 shadow-2xl border-4 border-zinc-800 rotate-12 opacity-80 scale-90 z-0">
            <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800/80"></div>
              </div>
              <div className="w-full h-full bg-orange-100 p-4 pt-12 blur-[1px]">
                <div className="w-full h-40 bg-orange-200 rounded-2xl mb-4"></div>
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-orange-300"></div>
                  <div className="w-16 h-16 rounded-xl bg-orange-300"></div>
                  <div className="w-16 h-16 rounded-xl bg-orange-300"></div>
                </div>
                <div className="w-full h-24 bg-white rounded-2xl mb-3"></div>
                <div className="w-full h-24 bg-white rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* Phone 1 (Front, straight) */}
          <div className="absolute right-[15%] top-0 w-[260px] h-[520px] bg-zinc-900 rounded-[2.5rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[5px] border-zinc-800 -rotate-2 z-10 transition-transform duration-500 hover:-rotate-0 hover:-translate-y-2">
            {/* Screen */}
            <div className="w-full h-full bg-slate-50 rounded-[2.1rem] overflow-hidden relative shadow-inner">
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex items-center justify-between px-2.5">
                <div className="w-1 h-1 rounded-full bg-green-500 opacity-60"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800/80 shadow-[inset_0_0_2px_rgba(255,255,255,0.1)]"></div>
              </div>

              {/* App UI */}
              <div className="w-full h-full flex flex-col pt-12 px-4 pb-4 bg-gradient-to-br from-orange-50 to-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Giao đến</p>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      Khu A, ĐHQG <span className="text-[#D35400]">▼</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-orange-200 overflow-hidden border border-orange-300">
                    <Image
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&w=100&q=80"
                      alt="Avatar"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Banner */}
                <div className="w-full h-28 rounded-2xl bg-[#D35400] relative overflow-hidden mb-5 shadow-lg flex items-center p-3">
                  <div className="z-10 w-2/3">
                    <p className="text-white font-black text-lg leading-tight mb-1">Giảm 20%</p>
                    <p className="text-white/80 text-[9px]">Đơn hàng đầu tiên!</p>
                  </div>
                  <Image
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&w=300&q=80"
                    width={96}
                    height={96}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 w-24 h-24 object-cover rounded-full drop-shadow-xl border-[3px] border-white/20"
                    alt="Burger"
                  />
                </div>

                {/* Categories */}
                <div className="flex justify-between mb-5">
                  {["Cơm", "Nước", "Ăn Vặt", "Salad"].map((cat, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${i === 0 ? "bg-[#D35400] text-white" : "bg-white text-gray-600"}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          ></path>
                        </svg>
                      </div>
                      <span className="text-[9px] font-semibold text-gray-700">{cat}</span>
                    </div>
                  ))}
                </div>

                {/* Popular Item */}
                <h3 className="text-xs font-bold text-gray-800 mb-2">Món Bán Chạy</h3>
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-3">
                  <Image
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&w=200&q=80"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                    alt="Food"
                  />
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-800 mb-0.5">Cơm Sườn Nướng</p>
                    <p className="text-[10px] text-gray-500 mb-1">Kèm canh & salad</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-[#D35400]">35.000đ</p>
                      <div className="w-5 h-5 rounded-full bg-[#D35400] text-white flex items-center justify-center text-xs">
                        +
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
