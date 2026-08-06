"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  Utensils,
  Smartphone,
  QrCode,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface StepItem {
  id: string;
  stepNum: string;
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tagColor: string;
}

const STEPS: StepItem[] = [
  {
    id: "step-1",
    stepNum: "01",
    title: "Nguồn Nông Sản Tươi Sạch 5:00 AM",
    subtitle: "Tươi sạch từ trang trại",
    description:
      "Rau củ, thịt mát tươi sạch được vận chuyển trực tiếp đến căng tin vào sáng sớm. Đội ngũ kiểm định chất lượng nghiêm ngặt trước khi chế biến.",
    imageSrc: "/images/about/farm_fresh.png",
    badge: "100% Nông Sản Tươi",
    icon: ShieldCheck,
    tagColor: "bg-emerald-600 text-white",
  },
  {
    id: "step-2",
    stepNum: "02",
    title: "Bếp Trung Tâm Nấu Nóng Hổi",
    subtitle: "Dinh dưỡng & Chuẩn vị",
    description:
      "Đầu bếp tay nghề cao chế biến suất ăn theo khẩu phần cân bằng calo (600 - 750 Kcal). Bếp trung tâm tuân thủ nghiêm ngặt vệ sinh ISO 22000.",
    imageSrc: "/images/about/hero_dish.png",
    badge: "Nóng Hổi Tươi Ngon",
    icon: Utensils,
    tagColor: "bg-amber-600 text-white",
  },
  {
    id: "step-3",
    stepNum: "03",
    title: "Đặt Món & Gán Mã QR Định Danh Khay",
    subtitle: "Thanh toán & Đặt trước qua App",
    description:
      "Xem thực đơn phiên ăn theo ngày, biết rõ định lượng calo & giá tiền. Đặt trước suất ăn trên App — hệ thống tự động gán mã QR định danh cho khay ăn của bạn.",
    imageSrc: "/images/about/app_pickup.png",
    badge: "Khay Dán Mã QR",
    icon: Smartphone,
    tagColor: "bg-orange-600 text-white",
  },
  {
    id: "step-4",
    stepNum: "04",
    title: "Robot Arm Quét Mã QR & Gắp Món Vào Khay",
    subtitle: "Robot gắp món tự động 100%",
    description:
      "Cánh tay Robot Arm dùng camera quét mã QR dán trên khay ăn định danh, tự động gắp đúng món chính, món canh & rau củ theo đơn hàng bỏ vào khay đó.",
    imageSrc: "/images/about/robot_arm.png",
    badge: "Robot Arm Gắp Món",
    icon: Bot,
    tagColor: "bg-blue-600 text-white",
  },
  {
    id: "step-5",
    stepNum: "05",
    title: "Quét Mã QR Nhận Khay Ăn < 5 phút",
    subtitle: "Bữa ăn sẵn sàng",
    description:
      "Bạn nhận thông báo đẩy khi khay ăn hoàn tất. Chỉ cần tới quầy, quét mã QR đơn hàng — nhận ngay khay ăn dán mã QR đã được Robot Arm gắp xếp đầy đủ.",
    imageSrc: "/images/about/tray_pickup.png",
    badge: "Nhận Khay Siêu Tốc",
    icon: QrCode,
    tagColor: "bg-purple-600 text-white",
  },
];

export default function AboutWorkflow3D() {
  const [activeIdx, setActiveIdx] = useState<number>(3); // Default Robot Arm (idx 3 = Step 4)
  const currentStep = STEPS[activeIdx];

  return (
    <section className="py-24 bg-[#FAF8F5] dark:bg-background relative overflow-hidden">
      {/* Background Subtle Shapes */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-orange-500/5 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Editorial Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-card border border-orange-500/15 shadow-sm text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="tracking-wide uppercase font-bold">Hành Trình Vận Hành Canteen</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Từ Trang Trại Đến Bàn Ăn{" "}
            <span className="italic font-medium text-orange-600 dark:text-orange-400">
              Với Robot Arm
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Khám phá 5 bước vận hành nhịp nhàng đảm bảo mỗi suất ăn gửi đến bạn luôn nóng hổi, an
            toàn và cực kỳ tiện lợi.
          </p>
        </div>

        {/* Editorial Step Navigation Tabs (01, 02, 03, 04, 05) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-14 overflow-x-auto pb-2 scrollbar-none">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveIdx(idx)}
                className={`px-5 py-3 rounded-full text-xs font-extrabold transition-all duration-300 flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25 scale-105"
                    : "bg-white dark:bg-card text-muted-foreground hover:text-foreground hover:bg-orange-50 dark:hover:bg-muted border border-orange-500/10"
                }`}
              >
                <span className="italic text-sm">{step.stepNum}.</span>
                <span>{step.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Storybook Grid Layout: Editorial Content (Left) & Arch Photo Frame (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white dark:bg-card rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-orange-500/15">
          {/* Left Column: Narrative Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <currentStep.icon className="w-4 h-4" />
              <span>
                Bước {currentStep.stepNum} • {currentStep.badge}
              </span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-snug">
              {currentStep.title}
            </h3>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {currentStep.description}
            </p>

            {/* Practical highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>Tiêu chuẩn kiểm định nghiêm ngặt theo thời gian thực</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>Kết nối trực tiếp giữa App, Nhà bếp & Robot Arm</span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-full border border-orange-500/20 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                ← Bước Trước
              </button>
              <button
                disabled={activeIdx === STEPS.length - 1}
                onClick={() => setActiveIdx((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="px-5 py-2 rounded-full bg-orange-600 text-white text-xs font-bold shadow-md hover:bg-orange-700 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                Bước Tiêu Theo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Arch Photography Display */}
          <div className="lg:col-span-6 relative flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-[420px] h-[340px] sm:h-[420px] rounded-t-[140px] rounded-b-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-4 border-white dark:border-muted bg-muted"
              >
                <Image
                  src={currentStep.imageSrc}
                  alt={currentStep.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                      Giai Đoạn {currentStep.stepNum}
                    </span>
                    <h4 className="text-base font-bold">{currentStep.subtitle}</h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${currentStep.tagColor} shadow`}
                  >
                    {currentStep.badge}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
