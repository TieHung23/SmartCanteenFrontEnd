"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Coffee,
  Sparkles,
  Info,
  ArrowRight,
  UtensilsCrossed,
  Zap,
  AlertTriangle,
} from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { SessionListItem, SessionCalendarData } from "@/types/session.types";
import { sessionService } from "@/services/session.service";

interface SessionCalendarHeatmapProps {
  sessions: SessionListItem[];
  onSelectDateToCreate: (dateStr: string) => void;
  onOpenSessionDetails: (sessionId: string) => void;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

const TIME_MARKERS = [
  { time: "00:00", percent: 0 },
  { time: "03:00", percent: 12.5 },
  { time: "06:00", percent: 25 },
  { time: "09:00", percent: 37.5 },
  { time: "12:00", percent: 50 },
  { time: "15:00", percent: 62.5 },
  { time: "18:00", percent: 75 },
  { time: "21:00", percent: 87.5 },
  { time: "24:00", percent: 100 },
];

function getIntensityColor(count: number): string {
  if (count === 0) return "bg-gray-100/90 hover:bg-gray-200 border-gray-200/70";
  if (count === 1) return "bg-orange-100 hover:bg-orange-200 border-orange-200 shadow-2xs";
  if (count === 2) return "bg-orange-300 hover:bg-orange-400 border-orange-300 shadow-xs";
  return "bg-[#D35400] hover:bg-[#b84900] border-amber-600 shadow-sm text-white font-black";
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatTimeString(isoStr?: string | null): string {
  if (!isoStr) return "--:--";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getMinutesFromISO(isoStr?: string | null): number {
  if (!isoStr) return 0;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 0;
  return d.getHours() * 60 + d.getMinutes();
}

export function SessionCalendarHeatmap({
  sessions,
  onSelectDateToCreate,
  onOpenSessionDetails,
}: SessionCalendarHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [calendarData, setCalendarData] = useState<SessionCalendarData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  const isPastDate = useMemo(() => {
    if (!selectedDate) return false;
    return dayjs(selectedDate).isBefore(dayjs(), "day");
  }, [selectedDate]);

  // Fetch calendar summary from API
  useEffect(() => {
    let cancelled = false;
    sessionService
      .getSessionCalendar(selectedYear)
      .then((res) => {
        if (!cancelled && res) {
          setCalendarData(res);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // Create count lookup map from calendarData.days or fall back to client sessions list
  const sessionCountMap = useMemo(() => {
    const map = new Map<string, number>();

    if (calendarData?.days && calendarData.days.length > 0) {
      calendarData.days.forEach((item) => {
        if (item.date) {
          map.set(item.date, item.sessionCount);
        }
      });
    }

    // Merge/augment with loaded client sessions
    sessions.forEach((s) => {
      if (s.availableFrom) {
        const d = dayjs(s.availableFrom).format("YYYY-MM-DD");
        const currentCount = map.get(d) || 0;
        if (!calendarData?.days || calendarData.days.length === 0) {
          map.set(d, currentCount + 1);
        }
      }
    });

    return map;
  }, [calendarData, sessions]);

  // Build grid of weeks (52-53 weeks x 7 days) for the selected year
  const heatmapGrid = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);

    const dayOfWeek = start.getDay(); // 0 is Sun, 1 is Mon...
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const gridStartDate = new Date(start);
    gridStartDate.setDate(gridStartDate.getDate() - offset);

    const weeks: Array<Array<{ dateStr: string; monthIndex: number; isSelectedYear: boolean }>> =
      [];
    let currentWeek: Array<{ dateStr: string; monthIndex: number; isSelectedYear: boolean }> = [];
    const curr = new Date(gridStartDate);

    while (curr <= end || currentWeek.length > 0) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const dateNum = String(curr.getDate()).padStart(2, "0");
      const monthNum = String(month + 1).padStart(2, "0");
      const dateStr = `${year}-${monthNum}-${dateNum}`;
      const isSelectedYear = year === selectedYear;

      currentWeek.push({
        dateStr,
        monthIndex: month,
        isSelectedYear,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        if (curr > end) break;
      }

      curr.setDate(curr.getDate() + 1);
    }

    const monthHeaders: Array<{ monthName: string; colIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, wIdx) => {
      const firstValidDay = week.find((d) => d.isSelectedYear);
      if (firstValidDay && firstValidDay.monthIndex !== lastMonth) {
        monthHeaders.push({
          monthName: MONTH_NAMES[firstValidDay.monthIndex],
          colIndex: wIdx,
        });
        lastMonth = firstValidDay.monthIndex;
      }
    });

    return { weeks, monthHeaders };
  }, [selectedYear]);

  // Filter sessions that occur on the selectedDate
  const daySessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions
      .filter((s) => {
        if (!s.availableFrom) return false;
        const fromDate = dayjs(s.availableFrom).format("YYYY-MM-DD");
        const toDate = s.availableTo
          ? dayjs(s.availableTo).subtract(1, "second").format("YYYY-MM-DD")
          : fromDate;
        return selectedDate >= fromDate && selectedDate <= toDate;
      })
      .sort((a, b) => getMinutesFromISO(a.availableFrom) - getMinutesFromISO(b.availableFrom));
  }, [sessions, selectedDate]);

  // Calculate year totals
  const totalSessionsInYear = useMemo(() => {
    if (calendarData?.totalSessions !== undefined) {
      return calendarData.totalSessions;
    }
    let count = 0;
    sessionCountMap.forEach((v) => {
      count += v;
    });
    return count;
  }, [calendarData, sessionCountMap]);

  const activeDaysInYear = useMemo(() => {
    let count = 0;
    sessionCountMap.forEach((v) => {
      if (v > 0) count++;
    });
    return count;
  }, [sessionCountMap]);

  const coveragePercent = useMemo(() => {
    return Math.round((activeDaysInYear / 365) * 100);
  }, [activeDaysInYear]);

  return (
    <div className="space-y-6">
      {/* ── TOP SECTION: HEATMAP + ANALYTICS PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Heatmap Grid (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center border border-orange-100 shadow-xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">
                  Lịch ca phục vụ {selectedYear}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-[#D35400] border border-orange-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  {totalSessionsInYear} ca ăn
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Click vào 1 ngày bất kỳ để xem khung giờ 24h và kiểm tra lịch.
              </p>
            </div>

            {/* Year Switcher */}
            <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 rounded-2xl p-1 shrink-0 self-start sm:self-center">
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all",
                    selectedYear === year
                      ? "bg-[#D35400] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white",
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap Matrix */}
          <div className="relative z-10 bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5 overflow-x-auto scrollbar-thin">
            <div className="min-w-[680px]">
              {/* Month Labels */}
              <div className="flex text-xs font-bold text-gray-500 mb-2 pl-8">
                {heatmapGrid.weeks.map((_, wIdx) => {
                  const header = heatmapGrid.monthHeaders.find((h) => h.colIndex === wIdx);
                  return (
                    <div key={wIdx} className="w-3 text-center shrink-0 mr-1">
                      {header ? (
                        <span className="text-gray-700 font-extrabold text-[11px]">
                          {header.monthName}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Grid Matrix */}
              <div className="flex gap-1">
                {/* Weekday Labels */}
                <div className="flex flex-col gap-1 pr-2 text-[10px] font-bold text-gray-400 shrink-0 pt-0.5">
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <div key={idx} className="h-3 flex items-center justify-end leading-none">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Matrix Squares */}
                <div className="flex gap-1 flex-1 justify-between">
                  {heatmapGrid.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                      {week.map((day, dIdx) => {
                        const count = sessionCountMap.get(day.dateStr) || 0;
                        const isSelected = selectedDate === day.dateStr;
                        const isToday = day.dateStr === new Date().toISOString().substring(0, 10);

                        if (!day.isSelectedYear) {
                          return <div key={dIdx} className="w-3 h-3 rounded-[3px] opacity-10" />;
                        }

                        return (
                          <div
                            key={dIdx}
                            onClick={() => setSelectedDate(day.dateStr)}
                            onMouseEnter={() => setHoveredDay({ date: day.dateStr, count })}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={cn(
                              "w-3 h-3 rounded-[3px] border transition-all duration-150 cursor-pointer relative",
                              getIntensityColor(count),
                              isSelected &&
                                "ring-2 ring-[#D35400] ring-offset-2 ring-offset-white z-20 scale-125",
                              isToday && !isSelected && "border-[#D35400] shadow-xs",
                            )}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend & Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-gray-200/80 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#D35400] shrink-0" />
                  {hoveredDay ? (
                    <span>
                      Ngày{" "}
                      <strong className="text-gray-900">{formatDateShort(hoveredDay.date)}</strong>:{" "}
                      <strong className="text-[#D35400]">{hoveredDay.count} ca phục vụ</strong>
                    </span>
                  ) : (
                    <span>
                      Đang chọn ngày:{" "}
                      <strong className="text-[#D35400] font-bold">
                        {formatDateShort(selectedDate)}
                      </strong>{" "}
                      ({sessionCountMap.get(selectedDate) || 0} ca)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[11px] text-gray-400 font-bold">Ít</span>
                  <span className="w-3 h-3 rounded-[2px] bg-gray-100 border border-gray-200 inline-block" />
                  <span className="w-3 h-3 rounded-[2px] bg-orange-100 border border-orange-200 inline-block" />
                  <span className="w-3 h-3 rounded-[2px] bg-orange-300 border border-orange-300 inline-block" />
                  <span className="w-3 h-3 rounded-[2px] bg-[#D35400] border border-amber-600 inline-block" />
                  <span className="text-[11px] text-gray-400 font-bold">Nhiều</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Summary Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 rounded-3xl border border-orange-100 p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#D35400]" />
              <h3 className="text-lg font-black text-gray-900">Thống kê ca ăn {selectedYear}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-xs">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Tổng ca ăn
                </span>
                <span className="text-2xl font-black text-gray-900">{totalSessionsInYear}</span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  trong năm {selectedYear}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-xs">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Tỷ lệ phủ ca
                </span>
                <span className="text-2xl font-black text-[#D35400]">{coveragePercent}%</span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  {activeDaysInYear}/365 ngày
                </span>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl border border-orange-100 p-4 space-y-2 text-xs font-medium text-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-bold">Ngày đang chọn:</span>
                <span className="font-black text-gray-900">{formatDateShort(selectedDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-bold">Số ca trong ngày:</span>
                <span className="font-black text-[#D35400]">{daySessions.length} ca</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              disabled={isPastDate}
              onClick={() => !isPastDate && onSelectDateToCreate(selectedDate)}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95",
                isPastDate
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none active:scale-100"
                  : "bg-[#D35400] text-white hover:bg-[#b84900] cursor-pointer",
              )}
              title={isPastDate ? "Không thể tạo ca ăn cho ngày trong quá khứ" : undefined}
            >
              <Plus className="w-4 h-4" />
              Tạo ca ăn ngày {formatDateShort(selectedDate)}
            </button>
            {isPastDate && (
              <p className="text-[11px] font-bold text-amber-600 text-center flex items-center justify-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Không thể tạo ca ăn cho ngày trong quá khứ
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── ACCURATE 24-HOUR TIME SLOTS TIMELINE (00:00 TO 24:00) ── */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
        {/* Header of Inspector */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D35400] flex items-center justify-center font-black border border-orange-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-gray-900">
                  Khung giờ 24h & Ca ăn ngày {formatDateShort(selectedDate)}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#D35400]">
                  {daySessions.length} ca
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Vị trí chính xác của từng ca ăn trên trục thời gian 24 giờ trong ngày.
              </p>
            </div>
          </div>
        </div>

        {/* ── PHYSICAL 24-HOUR TIMELINE BAR (00:00 - 24:00) ── */}
        <div className="bg-gray-50/90 rounded-2xl border border-gray-200/90 p-6 space-y-4">
          {/* Time Marker Ticks Guide (00:00 -> 24:00) */}
          <div className="relative h-6 w-full text-xs font-bold text-gray-400 select-none">
            {TIME_MARKERS.map((m) => (
              <span
                key={m.time}
                className="absolute transform -translate-x-1/2 text-[11px] font-extrabold text-gray-500"
                style={{ left: `${m.percent}%` }}
              >
                {m.time}
              </span>
            ))}
          </div>

          {/* Timeline Physical Grid Track */}
          <div className="relative h-12 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner flex items-center">
            {/* Background Grid Guide Lines */}
            {TIME_MARKERS.map((m) => (
              <div
                key={m.time}
                className="absolute top-0 bottom-0 border-r border-gray-100 pointer-events-none"
                style={{ left: `${m.percent}%` }}
              />
            ))}

            {daySessions.length === 0 ? (
              <div className="w-full text-center text-xs font-bold text-gray-400 italic">
                Cả ngày 24h còn trống
              </div>
            ) : (
              daySessions.map((s) => {
                const startM = getMinutesFromISO(s.availableFrom);
                let endM = getMinutesFromISO(s.availableTo);
                if (endM <= startM) endM = startM + 120; // fallback 2h

                const durationM = Math.max(endM - startM, 30);
                const leftPercent = Math.min(Math.max((startM / 1440) * 100, 0), 98);
                const widthPercent = Math.min(
                  Math.max((durationM / 1440) * 100, 5),
                  100 - leftPercent,
                );

                return (
                  <div
                    key={s.id}
                    onClick={() => onOpenSessionDetails(s.id)}
                    title={`${s.name} (${formatTimeString(s.availableFrom)} - ${formatTimeString(s.availableTo)})`}
                    className={cn(
                      "absolute top-1.5 bottom-1.5 rounded-lg flex items-center justify-between px-2.5 text-xs font-extrabold text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] hover:z-20 truncate border",
                      s.isActive
                        ? "bg-gradient-to-r from-[#D35400] to-amber-500 border-amber-600"
                        : "bg-gray-400 border-gray-500",
                    )}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  >
                    <span className="truncate">
                      {s.name} ({formatTimeString(s.availableFrom)} -{" "}
                      {formatTimeString(s.availableTo)})
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Day Sessions Detailed List Cards */}
        {daySessions.length === 0 ? (
          <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#D35400] mx-auto flex items-center justify-center border border-orange-100">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-800 font-bold text-base">
                Chưa có ca ăn nào được thiết lập cho ngày {formatDateShort(selectedDate)}.
              </p>
            </div>
            <button
              disabled={isPastDate}
              onClick={() => !isPastDate && onSelectDateToCreate(selectedDate)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs",
                isPastDate
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#D35400] text-white hover:bg-[#b84900] cursor-pointer",
              )}
              title={isPastDate ? "Không thể tạo ca ăn cho ngày trong quá khứ" : undefined}
            >
              <Plus className="w-4 h-4" />
              Tạo ca phục vụ cho ngày này
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daySessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onOpenSessionDetails(session.id)}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#D35400] flex items-center justify-center shrink-0 border border-orange-100">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-base group-hover:text-[#D35400] transition-colors">
                        {session.name}
                      </h4>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider",
                        session.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {session.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </div>

                  {session.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 italic">
                      {session.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-[#D35400]" />
                      Khung giờ: {formatTimeString(session.availableFrom)} -{" "}
                      {formatTimeString(session.availableTo)}
                    </span>
                    <span className="bg-orange-50 text-[#D35400] border border-orange-100/60 rounded-lg px-2 py-0.5 font-bold text-[11px]">
                      {session.dishes?.length ?? 0} món
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-400 font-medium">
                    Hạn chốt đơn: {formatTimeString(session.availableForOrder)}
                  </span>
                  <span className="text-[#D35400] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
