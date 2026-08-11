"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ThumbsUp, Leaf, Bot } from "lucide-react";

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  description: string;
}

const STATS: StatItem[] = [
  {
    icon: Clock,
    value: "< 5 phút",
    label: "Thời gian nhận suất ăn",
    description:
      "Tiết kiệm 95% thời gian đứng xếp hàng trưa bằng cách đặt món trước và quét mã QR.",
  },
  {
    icon: Bot,
    value: "100%",
    label: "Chính xác nhờ Robot Arm",
    description: "Cánh tay robot đọc mã QR dán trên khay ăn và gắp đúng các món theo đơn hàng.",
  },
  {
    icon: Leaf,
    value: "100% Sạch",
    label: "Nguồn thực phẩm an toàn",
    description: "100% nông sản và thịt mát được nhập mới và kiểm định từ 5:30 sáng mỗi ngày.",
  },
  {
    icon: ThumbsUp,
    value: "99.2%",
    label: "Đánh giá sự hài lòng",
    description: "Phản hồi tích cực từ sinh viên & giảng viên về độ nóng hổi và chất lượng món ăn.",
  },
];

export default function AboutStats() {
  return (
    <section className="py-20 bg-white dark:bg-card border-y border-orange-500/10 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-orange-500/10">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="pt-6 sm:pt-0 sm:px-6 first:px-0 space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <h3 className="text-sm font-bold text-foreground mt-1">{stat.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
