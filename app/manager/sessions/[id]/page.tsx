"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, UtensilsCrossed, Layers, Tag, Coffee } from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import type { SessionDetail } from "@/types/session.types";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";

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

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      sessionService.getSessionDetail(id),
      categoryService.getAll().catch(() => ({ items: [] as Category[] })),
    ])
      .then(([sessionData, catResult]) => {
        setSession(sessionData);
        setCategories(catResult.items);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-500">Đang tải chi tiết ca ăn...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-3xl text-base font-bold shadow-xs animate-fade-in">
        ⚠️ {error || "Session not found"}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push("/manager/sessions")}
          className="flex items-center gap-2 text-base font-bold text-gray-500 hover:text-[#D35400] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sessions
        </button>

        <div className="border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shadow-3xs shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900">{session.name}</h1>
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
              <p className="text-lg text-gray-500 italic mt-1 px-1">📝 {session.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Session schedule & templates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-2xs">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3">Thời gian ca trực</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Thời gian bắt đầu</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableFrom)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Thời gian kết thúc</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableTo)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 border border-orange-100/50 rounded-xl flex items-center justify-center shrink-0 text-[#D35400]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Hạn đặt cơm cuối</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {formatDate(session.availableForOrder)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <Layers className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                Định mức khuôn mẫu ({session.mealTemplates?.length ?? 0})
              </h2>
            </div>
            
            <div className="space-y-4">
              {session.mealTemplates?.map((template) => (
                <div key={template.id} className="bg-gray-50 border border-gray-100 rounded-3xl p-4 space-y-3">
                  <p className="text-base font-black text-gray-800">📋 {template.name}</p>
                  <div className="space-y-2">
                    {template.settings.map((s, i) => {
                      const cat = categories.find((c) => c.id === s.categoryId);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 text-sm bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-3xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {cat?.imgUrl ? (
                              <Image
                                src={cat.imgUrl}
                                alt={cat.name}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-lg object-cover border border-gray-100 shrink-0"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs shrink-0">
                                📂
                              </span>
                            )}
                            <span className="font-bold text-gray-800 truncate">
                              {cat?.name || s.categoryId.slice(0, 8)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs font-black text-gray-500 bg-gray-100 border border-gray-150 px-2 py-0.5 rounded-md">
                              {s.minQuantity} - {s.maxQuantity} món
                            </span>
                            {s.isRequired && (
                              <span className="text-[10px] text-red-600 font-black uppercase tracking-wider bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <UtensilsCrossed className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                Món ăn phục vụ ({session.dishes?.length ?? 0})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {session.dishes?.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-300 shadow-3xs flex flex-col"
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
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        🍽️
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-base font-black text-gray-900 truncate uppercase tracking-wide">
                      {d.dishName || d.dishId.slice(0, 8)}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      {d.priceAmount !== undefined && (
                        <span className="inline-flex items-center gap-1 font-black text-[#D35400] bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded-md text-xs">
                          {d.priceAmount} 
                          <div className="relative w-4 h-4 opacity-95"> {/* Có thể hạ xuống w-4 h-4 để vừa vặn hơn với chữ size text-xs */}
                            <Image
                              src="/logo_point.png"
                              alt="Watermark Logo"
                              fill
                              sizes="20px"
                              className="object-contain filter brightness-110"
                            />
                          </div>
                        </span>
                      )}
                      {d.preparedQuantity !== null && d.preparedQuantity !== undefined && (
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md">
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
    </div>
  );
}
