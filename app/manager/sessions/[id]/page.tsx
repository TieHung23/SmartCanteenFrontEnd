"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, UtensilsCrossed, Layers, Tag } from "lucide-react";
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error || "Session not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/manager/sessions")}
        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#D35400] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Session info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{session.name}</h1>
                {session.description && (
                  <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold",
                  session.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
                )}
              >
                {session.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#D35400]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Start</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(session.availableFrom)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#D35400]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">End</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(session.availableTo)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-[#D35400]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Order Open</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(session.availableForOrder)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meal Templates */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-base font-bold text-gray-800">
                Templates ({session.mealTemplates?.length ?? 0})
              </h2>
            </div>
            <div className="space-y-2">
              {session.mealTemplates?.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm font-bold text-gray-700 mb-2">📋 {template.name}</p>
                  <div className="space-y-1.5">
                    {template.settings.map((s, i) => {
                      const cat = categories.find((c) => c.id === s.categoryId);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                          {cat?.imgUrl ? (
                            <Image
                              src={cat.imgUrl}
                              alt={cat.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs shrink-0">
                              📂
                            </span>
                          )}
                          <span className="font-medium text-gray-700 truncate flex-1">
                            {cat?.name || s.categoryId.slice(0, 8)}
                          </span>
                          <span className="text-gray-500 shrink-0">
                            {s.minQuantity}-{s.maxQuantity}
                          </span>
                          {s.isRequired && (
                            <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                              Required
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dishes grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-[#D35400]" />
              <h2 className="text-base font-bold text-gray-800">
                Dishes ({session.dishes?.length ?? 0})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {session.dishes?.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    {d.imgUrl ? (
                      <Image
                        src={d.imgUrl}
                        alt={d.dishName || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {d.dishName || d.dishId.slice(0, 8)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      {d.priceAmount !== undefined && (
                        <span className="text-xs font-semibold text-gray-700">
                          {d.priceAmount} <span className="font-normal text-gray-400">Point</span>
                        </span>
                      )}
                      {d.preparedQuantity !== null && d.preparedQuantity !== undefined && (
                        <span className="text-xs text-gray-400">Prep: {d.preparedQuantity}</span>
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
