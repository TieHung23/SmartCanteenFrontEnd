"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, UtensilsCrossed, Layers } from "lucide-react";
import { sessionService } from "@/services/session.service";
import type { SessionDetail } from "@/types/session.types";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionService
      .getSessionDetail(id)
      .then(setSession)
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
    <div className="max-w-4xl space-y-6">
      <button
        onClick={() => router.push("/manager/sessions")}
        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#D35400] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#D35400]" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Start Time</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {formatDate(session.availableFrom)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#D35400]" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">End Time</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {formatDate(session.availableTo)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#D35400]" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Order Open</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {formatDate(session.availableForOrder)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-[#D35400]" />
          <h2 className="text-lg font-bold text-gray-800">
            Dishes ({session.dishes?.length ?? 0})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {session.dishes?.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {d.imgUrl ? (
                  <Image
                    src={d.imgUrl}
                    alt={d.dishName || ""}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-xl object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                    🍽️
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {d.dishName || d.dishId.slice(0, 8)}
                  </p>
                  {d.priceAmount !== undefined && (
                    <p className="text-xs text-gray-400">{d.priceAmount} Point</p>
                  )}
                  {d.preparedQuantity !== null && d.preparedQuantity !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">Prepared: {d.preparedQuantity}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#D35400]" />
          <h2 className="text-lg font-bold text-gray-800">
            Meal Templates ({session.mealTemplates?.length ?? 0})
          </h2>
        </div>
        <div className="space-y-3">
          {session.mealTemplates?.map((template) => (
            <div key={template.id} className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">📋 {template.name}</p>
              <div className="space-y-2">
                {template.settings.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm bg-white rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {s.categoryId.slice(0, 8)}...
                    </span>
                    <span className="text-gray-600 font-medium">
                      {s.minQuantity}-{s.maxQuantity}
                    </span>
                    {s.isRequired && (
                      <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
