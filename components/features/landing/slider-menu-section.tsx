"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sessionService } from "@/services/session.service";
import Link from "next/link";

const CARD_THEMES = [
  {
    bg: "bg-rose-100",
    text: "text-rose-950",
    subText: "text-rose-900/70",
    cardBg: "bg-white/40",
    button: "bg-rose-900 text-white hover:bg-rose-800",
  },
  {
    bg: "bg-orange-100",
    text: "text-orange-950",
    subText: "text-orange-900/70",
    cardBg: "bg-white/40",
    button: "bg-orange-900 text-white hover:bg-orange-800",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-950",
    subText: "text-emerald-900/70",
    cardBg: "bg-white/40",
    button: "bg-emerald-900 text-white hover:bg-emerald-800",
  },
  {
    bg: "bg-indigo-100",
    text: "text-indigo-950",
    subText: "text-indigo-900/70",
    cardBg: "bg-white/40",
    button: "bg-indigo-900 text-white hover:bg-indigo-800",
  },
];

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export default function SliderMenuSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "today"],
    queryFn: () => sessionService.getSessions({ isActive: true, pageSize: 20 }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lọc lấy tất cả các phiên ăn của ngày hôm nay
  const todaysSessions =
    data?.items?.filter((session) => {
      if (!session.availableFrom) return false;
      const sessionDate = new Date(session.availableFrom);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    }) || [];

  const maskStyle = {
    WebkitMask: `
      radial-gradient(circle 38px at 0% 50%, transparent 37px, black 38px) top left / 50.5% 100% no-repeat,
      radial-gradient(circle 38px at 100% 50%, transparent 37px, black 38px) top right / 50.5% 100% no-repeat
    `,
    mask: `
      radial-gradient(circle 38px at 0% 50%, transparent 37px, black 38px) top left / 50.5% 100% no-repeat,
      radial-gradient(circle 38px at 100% 50%, transparent 37px, black 38px) top right / 50.5% 100% no-repeat
    `,
  };

  if (isLoading) {
    return (
      <section className="relative w-full py-16 px-4 md:px-12 flex justify-center z-20 overflow-hidden min-h-[400px]">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E86A33]"></div>
        </div>
      </section>
    );
  }

  if (todaysSessions.length === 0) {
    return null; // Không hiển thị nếu hôm nay không có phiên nào
  }

  return (
    <section className="relative w-full py-16 px-4 md:px-12 flex flex-col items-center justify-center z-20 overflow-hidden">
      <div className="w-full max-w-[75rem] mb-10 flex items-center gap-4 pl-4 md:pl-0">
        <div className="orange-motion w-2.5 h-16 md:h-20 bg-[#D35400] shrink-0 shadow-sm"></div>
        <div className="flex flex-col text-left">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 font-serif drop-shadow-sm">
            Phiên Ăn Hôm Nay
          </h2>
          <p className="text-gray-500 mt-1 font-medium">Khám phá các ca phục vụ trong ngày</p>
        </div>
      </div>

      <div
        className="w-full max-w-[75rem] relative flex items-center justify-center"
        style={{ filter: "drop-shadow(0 15px 40px rgba(0,0,0,0.06))" }}
      >
        {/* Left Arrow */}
        <button className="hidden md:flex absolute left-0 -translate-x-1/2 w-[52px] h-[52px] bg-white rounded-full items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-gray-700 hover:bg-gray-50 transition-colors z-30">
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* Main White Container */}
        <div
          className="w-full bg-white rounded-[2.5rem] px-8 py-16 lg:px-16 relative"
          style={maskStyle}
        >
          {/* Today's Date Badge */}
          <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 px-6 py-3 rounded-bl-[2rem] rounded-tr-[2.5rem] font-bold text-sm flex items-center gap-2 shadow-sm">
            <CalendarDays className="w-5 h-5" />
            <span>
              {today.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16 mt-8">
            {todaysSessions.slice(0, 4).map((session, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];

              // Status logic
              const active = session.isActive;

              let statusBadge = null;
              if (active) {
                statusBadge = (
                  <span className="shrink-0 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-green-100 text-green-800">
                    Hoạt động
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="shrink-0 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-500">
                    {session.isFinalized ? "Đã chốt" : "Đã đóng"}
                  </span>
                );
              }

              return (
                <div
                  key={session.id}
                  className={`relative rounded-[2rem] p-6 flex flex-col shadow-xl hover:-translate-y-2 transition-transform duration-300 ${theme.bg} ${theme.text}`}
                >
                  {/* Header */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xl font-bold overflow-hidden text-ellipsis line-clamp-2 leading-tight">
                        {session.name}
                      </h3>
                      <div className="shrink-0 mt-0.5">{statusBadge}</div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div
                    className={`${theme.cardBg} rounded-2xl p-4 flex flex-col gap-2.5 text-sm font-medium shadow-inner mb-4 flex-1`}
                  >
                    <div
                      className={`flex justify-between items-center border-b border-black/5 pb-2.5`}
                    >
                      <span className={theme.subText}>Giờ phục vụ:</span>
                      <span className="font-bold">
                        {formatTime(session.availableFrom)} - {formatTime(session.availableTo)}
                      </span>
                    </div>
                    {session.availableForOrder && (
                      <div className="flex justify-between items-center">
                        <span className={theme.subText}>Hạn đặt món:</span>
                        <span className="font-bold">{formatTime(session.availableForOrder)}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {session.description && (
                    <p
                      className={`text-sm ${theme.subText} line-clamp-2 mb-6 leading-relaxed flex-1`}
                    >
                      {session.description}
                    </p>
                  )}

                  {/* Action */}
                  <div className="w-full mt-auto">
                    {active ? (
                      <Link
                        href={`/menu?sessionId=${session.id}`}
                        className={`font-bold px-6 py-3 rounded-full text-sm transition-colors shadow-sm w-full flex justify-center items-center gap-2 group ${theme.button}`}
                      >
                        <span>Xem Thực Đơn</span>
                        <ChevronRight
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                          strokeWidth={3}
                        />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="font-bold px-6 py-3 rounded-full text-sm shadow-sm w-full flex justify-center items-center gap-2 opacity-50 cursor-not-allowed bg-black/5 text-black/50"
                      >
                        <span>Đóng Đặt Món</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Arrow */}
        <button className="hidden md:flex absolute right-0 translate-x-1/2 w-[52px] h-[52px] bg-white rounded-full items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-gray-700 hover:bg-gray-50 transition-colors z-30">
          <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}
