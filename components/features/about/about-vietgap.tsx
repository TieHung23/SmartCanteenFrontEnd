"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Leaf, ShieldCheck, CheckCircle2, QrCode, Thermometer, Award } from "lucide-react";

interface FoodSafetyPillar {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const PILLARS: FoodSafetyPillar[] = [
  {
    title: "100% Nông Sản Tươi Thu Hoạch Sáng Sớm",
    subtitle: "Trang trại đối tác an toàn",
    description:
      "Rau củ, thịt cá tươi mát được vận chuyển trực tiếp từ các trang trại an toàn tới canteen vào lúc 5:00 AM mỗi ngày. Tuyệt đối không sử dụng thực phẩm đông lạnh tồn trữ quá 24h.",
    icon: Leaf,
    tag: "Tươi Tới 100%",
  },
  {
    title: "Quy Trình Kiểm Định An Toàn 4 Bước",
    subtitle: "Vô trùng & Tinh sạch",
    description:
      "Mỗi lô hàng trước khi đưa vào sơ chế đều phải trải qua 4 bước kiểm định: test nhanh dư lượng thực vật, đo độ tươi, rửa bằng công nghệ sục Ozone và khử khuẩn vi sinh.",
    icon: ShieldCheck,
    tag: "Khử Khuẩn Ozone",
  },
  {
    title: "Truy Xuất Nguồn Gốc & Tính Calo Chuẩn Y Khoa",
    subtitle: "Minh bạch 100%",
    description:
      "Người dùng có thể quét mã QR trên từng suất ăn để xem chính xác thông tin nguồn gốc, thời gian nấu và bảng phân tích dinh dưỡng (Calo, Protein, Carbs, Vitamin).",
    icon: QrCode,
    tag: "Minh Bạch Dinh Dưỡng",
  },
  {
    title: "Chuỗi Cung Ứng Lạnh Bảo Quản Standard Cold Chain",
    subtitle: "Giữ trọn vi chất",
    description:
      "Nguyên liệu được duy trì liên tục ở nhiệt độ 2°C - 5°C trong suốt quá trình vận chuyển và lưu trữ tại bếp trung tâm, giữ nguyên độ ngọt tự nhiên và vitamin.",
    icon: Thermometer,
    tag: "Nhiệt Độ 2°C - 5°C",
  },
];

export default function AboutVietGap() {
  return (
    <section className="py-24 bg-white dark:bg-card border-y border-orange-500/10 relative overflow-hidden">
      {/* Background Soft Ambient Light */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="tracking-wide uppercase font-bold">
              Cam Kết Nguồn Thực Phẩm Tươi Sạch 100%
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Thực Phẩm Sạch Từ Tâm,{" "}
            <span className="italic font-medium text-emerald-600 dark:text-emerald-400">
              An Tâm Trong Từng Bữa Ăn
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Smart Canteen áp dụng quy chuẩn kiểm soát an toàn thực phẩm nghiêm ngặt nhất từ trang
            trại đối tác đến từng khay ăn trao tay sinh viên & cán bộ.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Arch Photo Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="relative w-full max-w-[360px] h-[460px] rounded-t-[160px] rounded-b-[40px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.1)] border-4 border-white dark:border-muted bg-muted">
              <Image
                src="/images/about/food_safety.png"
                alt="Food Safety Preparation"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Floating Stamp - Centered safely inside arch curve to prevent clipping */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5 border border-white/20 whitespace-nowrap z-10">
                <CheckCircle2 className="w-4 h-4" /> An Toàn Thực Phẩm
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
                  Tiêu Chuẩn Nông Sản Sạch
                </span>
                <h4 className="text-xl font-bold">100% Nguyên Liệu Khử Khuẩn</h4>
                <p className="text-xs text-white/80">Sơ chế vô trùng tại bếp trung tâm đạt chuẩn</p>
              </div>
            </div>

            {/* Overlapping Badge Pill */}
            <div className="absolute -bottom-4 -right-2 bg-white dark:bg-card px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/20 flex items-center gap-3 z-20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Chứng Nhận ISO 22000</p>
                <p className="text-[11px] text-muted-foreground">Bếp Trung Tâm Vô Trùng</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 4 Food Safety Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="p-6 rounded-[2rem] bg-[#FAF8F5] dark:bg-muted/40 border border-emerald-500/15 hover:border-emerald-500/35 transition-all duration-300 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        {pillar.tag}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-foreground leading-snug">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                        {pillar.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
