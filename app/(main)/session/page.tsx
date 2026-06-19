"use client";

import { useState, useMemo, useEffect } from "react";
import { useSessions } from "@/lib/hooks/use-sessions";
import { cn, isSessionActive, isSessionExpired } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import type { SessionListItem } from "@/types/session.types";

const generateCalendarDays = () => {
  const dates = [];
  for (let i = -3; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatTime = (dateString: string) => {
  if (!dateString) return "00 : 00";
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours} : ${minutes}`;
};

const isSameDay = (date1: Date, date2: Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const SESSION_TAGS: Record<
  string,
  { label: string; bg: string; color: string; accent: string; iconBg: string }
> = {
  morning: {
    label: "MORNING",
    bg: "#FEF3EC",
    color: "#A03D14",
    accent: "#F97316",
    iconBg: "#FEF3EC",
  },
  lunch: { label: "LUNCH", bg: "#E8F5E9", color: "#2E7D32", accent: "#43A047", iconBg: "#F1F8E9" },
  dinner: {
    label: "DINNER",
    bg: "#EDE7F6",
    color: "#512DA8",
    accent: "#7E57C2",
    iconBg: "#F3E5F5",
  },
};

const getSessionType = (availableFrom: string) => {
  const hour = new Date(availableFrom).getHours();
  if (hour < 11) return "morning";
  if (hour < 15) return "lunch";
  return "dinner";
};

const SESSION_ICONS: Record<string, string> = {
  morning: "🌅",
  lunch: "🥗",
  dinner: "🍛",
};

const MOCK_PLATES = [
  { id: 1, name: "Premium Steak", src: "/plate1.png" },
  { id: 2, name: "Healthy Bowl", src: "/plate2.png" },
  { id: 3, name: "Vegan Salad", src: "/plate3.png" },
];

export default function SessionPage() {
  const calendarDays = useMemo(() => generateCalendarDays(), []);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return calendarDays.find((d) => isSameDay(d, today)) || calendarDays[3];
  });

  const { data: sessionsData, isLoading, isSuccess } = useSessions(true);
  const [activePlate, setActivePlate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlate((prev) => (prev + 1) % MOCK_PLATES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = useMemo(() => {
    const responseData = sessionsData as unknown as {
      value?: { items: SessionListItem[] };
      items?: SessionListItem[];
    };
    const items = responseData?.value?.items || responseData?.items;

    if (!isSuccess || !items || !Array.isArray(items)) {
      return [];
    }

    return items.filter((session: SessionListItem) => {
      if (!session || !session.availableFrom) return false;
      const sessionDate = new Date(session.availableFrom);
      return isSameDay(sessionDate, selectedDate);
    });
  }, [sessionsData, isSuccess, selectedDate]);

  const daysWithSessions = useMemo(() => {
    const responseData = sessionsData as unknown as {
      value?: { items: SessionListItem[] };
      items?: SessionListItem[];
    };
    const items = responseData?.value?.items || responseData?.items;

    if (!isSuccess || !items || !Array.isArray(items)) {
      return new Set<string>();
    }

    return new Set(
      items
        .map((session: SessionListItem) => {
          if (!session || !session.availableFrom) return "";
          const d = new Date(session.availableFrom);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
        .filter(Boolean),
    );
  }, [sessionsData, isSuccess]);

  const hasSessionOnDate = (date: Date) =>
    daysWithSessions.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#FAF8F5] pb-24 font-sans">
        {/* ── HERO BANNER HIỆN ĐẠI ── */}
        <div className="relative w-full overflow-hidden pt-8 md:pt-14 pb-16 md:pb-24">
          <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-orange-200/40 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 min-h-[24rem] lg:min-h-[30rem] px-6 md:px-12 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-5/12 mb-16 md:mb-0">
              <span className="text-[#A03D14] font-bold tracking-[0.25em] uppercase text-sm md:text-base mb-5">
                Curated Dining Experience
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-serif font-extrabold text-[#1a0a00] leading-[1.1] mb-6 drop-shadow-sm">
                Elevate Your <br />
                <span className="text-[#D35400]">Daily Meals</span>
              </h1>
              <p className="text-gray-600 font-medium text-base md:text-lg max-w-md leading-relaxed">
                Explore our curated menu, crafted by expert chefs. Select a session below to begin
                your culinary journey.
              </p>
            </div>

            <div className="relative w-full md:w-7/12 h-72 md:h-[30rem] flex items-center justify-center pointer-events-auto">
              {MOCK_PLATES.map((plate, index) => {
                const position = (index - activePlate + 3) % 3;
                const baseStyle = "absolute transition-all duration-700 ease-in-out transform-gpu";
                let positioningStyle = "";

                if (position === 0) {
                  positioningStyle =
                    "z-30 scale-[1.15] md:scale-125 top-[10%] md:top-[15%] left-1/2 -translate-x-1/2 opacity-100 drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]";
                } else if (position === 1) {
                  positioningStyle =
                    "z-20 scale-[0.65] md:scale-[0.65] top-[50%] md:top-[55%] left-[80%] md:left-[85%] -translate-x-1/2 opacity-60 hover:opacity-100 hover:scale-[0.75] cursor-pointer drop-shadow-lg";
                } else {
                  positioningStyle =
                    "z-20 scale-[0.65] md:scale-[0.65] top-[50%] md:top-[55%] left-[20%] md:left-[15%] -translate-x-1/2 opacity-60 hover:opacity-100 hover:scale-[0.75] cursor-pointer drop-shadow-lg";
                }

                return (
                  <div
                    key={plate.id}
                    onClick={() => setActivePlate(index)}
                    className={`${baseStyle} ${positioningStyle} w-56 h-56 md:w-80 md:h-80`}
                  >
                    <Image
                      src={plate.src}
                      alt={plate.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain"
                      priority={position === 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-4 md:px-6 lg:px-10 max-w-7xl mx-auto">
          <p className="text-sm md:text-base font-bold tracking-[0.2em] text-gray-400 uppercase mb-5">
            Choose a day
          </p>
          <div className="flex overflow-x-auto gap-3 md:gap-5 mb-12 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {calendarDays.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              // Highlight chữ "Today" nếu là hôm nay
              const dayName = isToday
                ? "Today"
                : date.toLocaleDateString("en-US", { weekday: "short" });
              const dayNumber = date.getDate();
              const hasSession = hasSessionOnDate(date);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center py-5 md:py-6 rounded-3xl transition-all duration-300 gap-1.5 border-2 snap-center",
                    isSelected
                      ? "bg-[#D35400] text-white shadow-[0_10px_30px_rgba(211,84,0,0.3)] border-[#D35400] scale-105"
                      : "bg-white text-gray-700 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm md:text-base font-semibold",
                      isSelected ? "text-white/80" : "text-gray-400",
                    )}
                  >
                    {dayName}
                  </span>
                  <span className="text-3xl md:text-4xl font-extrabold leading-none my-1">
                    {dayNumber}
                  </span>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full mt-1 transition-colors duration-300",
                      hasSession ? (isSelected ? "bg-white" : "bg-[#D35400]") : "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* ── Meal Cards ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm">
              <p className="text-6xl mb-6 opacity-60">🍽️</p>
              <p className="text-lg md:text-xl font-medium text-gray-500">
                Không có ca ăn nào trong ngày này.
              </p>
            </div>
          ) : (
            <>
              <p className="text-base font-bold text-gray-400 mb-6 tracking-wide">
                {filteredSessions.length} SESSION{filteredSessions.length > 1 ? "S" : ""} AVAILABLE
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {filteredSessions.map((session: SessionListItem) => {
                  const type = getSessionType(session.availableFrom);
                  const tag = SESSION_TAGS[type];
                  const icon = SESSION_ICONS[type];
                  const expired = isSessionExpired(session.availableTo);
                  const active = isSessionActive(session.availableFrom, session.availableTo);

                  const cardContent = (
                    <div
                      className={`relative border-2 rounded-3xl p-6 md:p-8 flex items-center gap-6 transition-all duration-300 overflow-hidden min-h-[160px] ${
                        expired
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-gray-100/60 group-hover:border-orange-200 group-hover:shadow-[0_15px_40px_-10px_rgba(211,84,0,0.1)]"
                      }`}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 rounded-l-3xl transition-colors duration-300"
                        style={{ background: expired ? "#9CA3AF" : tag.accent }}
                      />

                      <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl flex-shrink-0 ml-3 shadow-sm border border-gray-50"
                        style={{ background: expired ? "#F3F4F6" : tag.iconBg }}
                      >
                        {expired ? "⏳" : icon}
                      </div>

                      <div className="flex-1 min-w-0 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          {expired ? (
                            <span className="inline-block text-xs font-bold tracking-widest px-3 py-1 rounded-lg bg-gray-200 text-gray-500">
                              EXPIRED
                            </span>
                          ) : active ? (
                            <span className="inline-block text-xs font-bold tracking-widest px-3 py-1 rounded-lg bg-green-100 text-green-700">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block text-xs font-bold tracking-widest px-3 py-1 rounded-lg bg-blue-100 text-blue-700">
                              UPCOMING
                            </span>
                          )}
                          <span
                            className="inline-block text-xs font-bold tracking-widest px-3 py-1 rounded-lg"
                            style={{
                              background: expired ? "#F3F4F6" : tag.bg,
                              color: expired ? "#9CA3AF" : tag.color,
                            }}
                          >
                            {tag.label}
                          </span>
                        </div>

                        <p
                          className={`text-xl md:text-2xl font-bold truncate leading-snug mb-2 transition-colors ${
                            expired ? "text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {session.name}
                        </p>

                        {session.description && (
                          <p
                            className={`text-base truncate mb-3 ${expired ? "text-gray-300" : "text-gray-500"}`}
                          >
                            {session.description}
                          </p>
                        )}

                        <div
                          className="flex items-center gap-2 text-base font-semibold"
                          style={{ color: expired ? "#9CA3AF" : tag.color }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatTime(session.availableFrom)} – {formatTime(session.availableTo)}
                        </div>
                      </div>

                      {!expired && (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D35400] transition-colors duration-300 mr-2">
                          <svg
                            className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-white transition-colors"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );

                  if (expired) {
                    return (
                      <div key={session.id} className="block cursor-not-allowed">
                        {cardContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      href={`/menu?sessionId=${session.id}`}
                      key={session.id}
                      className="block group"
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
