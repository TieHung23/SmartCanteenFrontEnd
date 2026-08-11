"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Utensils, Bot, Sparkles, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function AboutHero3D() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#FAF8F5] dark:bg-background pt-16 pb-24">
      {/* Organic Background Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FCE8D5]/60 dark:bg-orange-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#E8F0EA]/60 dark:bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Human Editorial Typography */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 space-y-7 text-left"
        >
          {/* Subtitle Accent */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-card border border-orange-500/15 shadow-sm text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="tracking-wide uppercase font-bold">Căng Tin Thông Minh 4.0</span>
          </div>

          {/* Main Headline with Serif Accent */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.1]">
            Hương Vị Sạch,{" "}
            <span className="italic font-medium text-orange-600 dark:text-orange-400">
              Công Nghệ Robot
            </span>{" "}
            & Bữa Ăn Không Đợi Chờ.
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-normal max-w-2xl">
            Chúng tôi kiến tạo trải nghiệm ẩm thực căng tin hiện đại: món ăn tươi sạch an toàn, khay
            ăn dán <strong className="text-foreground font-semibold">mã QR định danh</strong> kết
            hợp{" "}
            <strong className="text-foreground font-semibold">
              Cánh Tay Robot Arm tự động gắp món vào khay
            </strong>{" "}
            chuẩn xác 100%.
          </p>

          {/* Editorial Highlights */}
          <div className="grid grid-cols-3 gap-6 pt-3 border-t border-orange-500/10">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
                &lt; 5m
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Thời gian nhận khay ăn
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                100%
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Robot Arm gắp chuẩn món
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                QR Code
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Mã QR định danh khay
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/session">
              <Button
                size="lg"
                className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xl shadow-orange-600/20 px-9 py-6 text-base gap-2.5 group"
              >
                <Utensils className="w-5 h-5" />
                Khám Phá Phiên Ăn
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Human Agency Overlapping Arch Photo Frames */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative flex justify-center items-center pt-8 lg:pt-0"
        >
          {/* Main Large Arch Photo Container */}
          <div className="relative w-[280px] sm:w-[340px] h-[380px] sm:h-[450px] rounded-t-[140px] rounded-b-[40px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-4 border-white dark:border-card bg-muted">
            <Image
              src="/images/about/hero_dish.png"
              alt="Smart Canteen Gourmet Meal Tray"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
            />
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                Khay Ăn Mã QR #SC-8921
              </span>
              <h3 className="text-lg font-bold">Cơm Tấm Sườn Nướng Nóng Hổi</h3>
              <p className="text-xs text-white/80">Robot Arm đã gắp đầy đủ món vào khay</p>
            </div>
          </div>

          {/* Overlapping Floating Secondary Arch Photo Frame (Robot Arm) */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="absolute -bottom-6 -left-4 sm:-left-10 w-[180px] sm:w-[220px] h-[220px] sm:h-[260px] rounded-t-[90px] rounded-b-[30px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.18)] border-4 border-white dark:border-card bg-muted z-20"
          >
            <Image
              src="/images/about/robot_arm.png"
              alt="Robot Arm Picking Food into QR Tray"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/90 text-[10px] font-extrabold shadow">
                <Bot className="w-3.5 h-3.5" /> Robot Gắp Món
              </div>
            </div>
          </motion.div>

          {/* Decorative Floating Pill Badge */}
          <div className="absolute -top-4 -right-2 sm:right-0 bg-white dark:bg-card px-4 py-2.5 rounded-2xl shadow-xl border border-orange-500/15 flex items-center gap-3 z-30 animate-pulse">
            <QrCode className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs font-bold text-foreground">Khay Dán Mã QR</p>
              <p className="text-[10px] text-muted-foreground">Định Danh Đơn Hàng</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
