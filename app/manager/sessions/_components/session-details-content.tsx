"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Clock, UtensilsCrossed, Layers, Tag, Coffee } from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import type { SessionDetail } from "@/types/session.types";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";

interface SessionDetailsContentProps {
  sessionId: string;
  onClose: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionDetailsContent({ sessionId, onClose }: SessionDetailsContentProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      sessionService.getSessionDetail(sessionId),
      categoryService.getAll().catch(() => ({ items: [] as Category[] })),
    ])
      .then(([sessionData, catResult]) => {
        setSession(sessionData);
        setCategories(catResult.items);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load session details"),
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải chi tiết ca ăn...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs">
        ⚠️ {error || "Session not found"}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-6 select-text">
      {/* Header Info */}
      <div className="border-b border-gray-150 pb-4">
        <div className="flex flex-wrap items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shadow-3xs shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">{session.name}</h1>
          <span
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
              session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500",
            )}
          >
            {session.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {session.description && (
          <p className="text-base text-gray-500 italic mt-1 px-1">📝 {session.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left column: Session schedule & templates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Card */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3">
              Thời gian ca trực
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Thời gian bắt đầu
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableFrom)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Thời gian kết thúc
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableTo)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Hạn đặt cơm cuối
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableForOrder)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Card */}
          <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <Layers className="w-4 h-4 text-[#D35400]" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Định mức khuôn mẫu ({session.mealTemplates?.length ?? 0})
              </h2>
            </div>

            <div className="space-y-4 max-h-[16rem] overflow-y-auto pr-1">
              {session.mealTemplates?.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-50/70 border border-gray-150/60 rounded-2xl p-4 space-y-3"
                >
                  <p className="text-sm font-black text-gray-800">📋 {template.name}</p>
                  <div className="space-y-2">
                    {template.settings.map((s, i) => {
                      const cat = categories.find((c) => c.id === s.categoryId);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 text-xs bg-white rounded-xl px-3 py-2.5 border border-gray-150/60 shadow-3xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {cat?.imgUrl ? (
                              <div className="relative w-6 h-6 rounded-md overflow-hidden border border-gray-100 shrink-0">
                                <Image
                                  src={cat.imgUrl}
                                  alt={cat.name}
                                  fill
                                  className="object-cover"
                                  sizes="24px"
                                />
                              </div>
                            ) : (
                              <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0">
                                📂
                              </span>
                            )}
                            <span className="font-bold text-gray-800 truncate">
                              {cat?.name || s.categoryId.slice(0, 8)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                              {s.minQuantity} - {s.maxQuantity} món
                            </span>
                            {s.isRequired && (
                              <span className="text-[9px] text-red-600 font-black uppercase tracking-wider bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Dishes list */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-3xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <UtensilsCrossed className="w-4 h-4 text-[#D35400]" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Món ăn phục vụ ({session.dishes?.length ?? 0})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[30rem] overflow-y-auto pr-1">
              {session.dishes?.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-gray-150 overflow-hidden hover:shadow-sm hover:border-orange-200 transition-all duration-300 shadow-3xs flex flex-col"
                >
                  <div className="relative w-full aspect-[16/10] bg-gray-50 border-b border-gray-100">
                    {d.imgUrl ? (
                      <Image
                        src={d.imgUrl}
                        alt={d.dishName || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        🍽️
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-sm font-black text-gray-900 truncate uppercase tracking-wider">
                      {d.dishName || d.dishId.slice(0, 8)}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      {d.priceAmount !== undefined && (
                        <span className="inline-flex items-center gap-1 font-black text-[#D35400] bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded-md text-[10px]">
                          {d.priceAmount}
                          <div className="relative w-3.5 h-3.5 opacity-95">
                            <Image
                              src="/logo_point.png"
                              alt="Point Logo"
                              fill
                              sizes="14px"
                              className="object-contain filter brightness-110"
                            />
                          </div>
                        </span>
                      )}
                      {d.preparedQuantity !== null && d.preparedQuantity !== undefined && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md">
                          Chuẩn bị: {d.preparedQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-gray-150 pt-5 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-250 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Đóng lại
        </button>
      </div>
    </div>
  );
}
