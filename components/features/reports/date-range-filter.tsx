"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import type { ReportPreset, DateRange } from "@/types/report.types";

const presets: { label: string; value: ReportPreset }[] = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "thisWeek" },
  { label: "30 ngày", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
];

function computeRange(preset: ReportPreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "today": {
      const d = format(now, "yyyy-MM-dd");
      return { from: d, to: d };
    }
    case "thisWeek": {
      const from = format(subDays(now, 6), "yyyy-MM-dd");
      const to = format(now, "yyyy-MM-dd");
      return { from, to };
    }
    case "thisMonth": {
      const from = format(subDays(now, 29), "yyyy-MM-dd");
      const to = format(now, "yyyy-MM-dd");
      return { from, to };
    }
    case "lastMonth": {
      const last = subMonths(now, 1);
      const from = format(startOfMonth(last), "yyyy-MM-dd");
      const to = format(endOfMonth(last), "yyyy-MM-dd");
      return { from, to };
    }
    default:
      return { from: format(now, "yyyy-MM-dd"), to: format(now, "yyyy-MM-dd") };
  }
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<ReportPreset>("thisMonth");
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (preset: ReportPreset) => {
    setActivePreset(preset);
    setShowCustom(false);
    onChange(computeRange(preset));
  };

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      setActivePreset("custom");
      onChange({ from: customFrom, to: customTo });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activePreset === p.value
              ? "bg-[#D35400] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-orange-200"
          }`}
        >
          {p.label}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activePreset === "custom"
              ? "bg-[#D35400] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-orange-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Tùy chọn
          <ChevronDown className="w-4 h-4" />
        </button>
        {showCustom && (
          <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 min-w-[280px]">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Từ ngày</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Đến ngày</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400]"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                className="w-full px-4 py-2 bg-[#D35400] text-white rounded-xl text-sm font-bold hover:bg-[#c04e00] transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-400 ml-2">
        {(() => {
          const f = value.from.split("-");
          const t = value.to.split("-");
          const fromStr = f.length === 3 ? `${f[2]}/${f[1]}/${f[0]}` : value.from;
          const toStr = t.length === 3 ? `${t[2]}/${t[1]}/${t[0]}` : value.to;
          return `${fromStr} - ${toStr}`;
        })()}
      </span>
    </div>
  );
}
