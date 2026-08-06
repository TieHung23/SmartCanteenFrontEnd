"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, RotateCcw, Sparkles, Utensils, Bot } from "lucide-react";

interface Commitment {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge: string;
  accentColor: string;
}

const COMMITMENTS: Commitment[] = [
  {
    title: "Nguyên Liệu Tươi Sạch Trong Ngày",
    subtitle: "Cam kết nguồn gốc",
    icon: ShieldCheck,
    description:
      "100% rau củ, thịt cá được nhập tươi mới mỗi sáng từ các nguồn cung ứng uy tín. Không sử dụng nguyên liệu đông lạnh tồn dư quá ngày.",
    badge: "An Toàn Thực Phẩm",
    accentColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Tự Động Hóa 100% Nhờ Robot Arm",
    subtitle: "Công nghệ tiên phong",
    icon: Bot,
    description:
      "Hệ thống Robot Arm đọc mã QR dán trên khay ăn định danh, tự động gắp đúng món theo đơn đặt. Đảm bảo khay ăn trao tay người dùng chính xác 100%.",
    badge: "Robot Arm 4.0",
    accentColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Thực Đơn Đổi Mới & Minh Bạch Calo",
    subtitle: "Dinh dưỡng cân bằng",
    icon: Utensils,
    description:
      "Thực đơn luân phiên đa dạng theo ngày. Mỗi suất ăn đều ghi rõ định lượng calo và thành phần giúp sinh viên & cán bộ dễ dàng chọn bữa ăn khoa học.",
    badge: "Sức Khỏe Học Đường",
    accentColor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  {
    title: "Chính Sách Đổi Trả & Lắng Nghe 24/7",
    subtitle: "Quyền lợi khách hàng",
    icon: RotateCcw,
    description:
      "Nếu có bất kỳ không hài lòng nào về món ăn, bạn chỉ cần gửi phản hồi ngay trên App để được hoàn tiền hoặc đổi món mới tức thì.",
    badge: "Minh Bạch 100%",
    accentColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
];

export default function AboutMissionCards() {
  return (
    <section
      id="vision"
      className="py-24 relative bg-muted/20 border-y border-orange-500/10 overflow-hidden"
    >
      {/* Background organic glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Cam Kết Từ Đội Ngũ Smart Canteen
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Đặt Trải Nghiệm & Sức Khỏe Của Bạn{" "}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Làm Trọng Tâm
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Chúng tôi tự hào kết hợp nghệ thuật nấu ăn chuẩn vị cùng hạ tầng công nghệ tự động hóa
            hiện đại bậc nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {COMMITMENTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-card/90 backdrop-blur-md border border-orange-500/15 shadow-[0_8px_30px_-8px_rgba(249,115,22,0.06)] hover:border-orange-500/35 hover:shadow-xl transition-all duration-300 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3.5 rounded-2xl ${item.accentColor} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-orange-500 tracking-wider uppercase">
                    {item.subtitle}
                  </p>
                  <h3 className="text-xl font-extrabold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {item.description}
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
