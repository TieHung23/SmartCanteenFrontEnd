"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Utensils, Heart, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutCTA() {
  return (
    <section className="py-20 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[3rem] overflow-hidden p-8 sm:p-16 bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 shadow-[0_25px_60px_-15px_rgba(234,88,12,0.35)] text-white text-center"
        >
          {/* Background Ambient Glows & Curved Shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold uppercase shadow-sm">
                <Heart className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>Trải Nghiệm Đỉnh Cao Bữa Ăn Học Đường</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold uppercase shadow-sm">
                <Bot className="w-4 h-4 text-amber-200" />
                <span>Robot Arm Phục Vụ</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Sẵn Sàng Thưởng Thức Bữa Ăn Nóng Hổi Hôm Nay?
            </h2>

            <p className="text-white/90 text-sm sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Không còn lo lắng chờ đợi giữa giờ nghỉ trưa. Đặt suất ăn yêu thích ngay trên ứng dụng
              và nhận món chỉ trong 30 giây!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/session">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-orange-600 hover:bg-orange-50 font-extrabold shadow-xl px-9 py-6 text-base gap-2.5 group transition-all duration-300"
                >
                  <Utensils className="w-5 h-5 text-orange-600" />
                  Khám Phá Phiên Ăn Ngay
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
