"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionService } from "@/services/session.service";
import type { SessionDetail } from "@/types/session.types";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
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
        <span className="ml-3 text-sm text-gray-500">Loading...</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{session.description}</p>
        </div>
        <span
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold",
            session.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500",
          )}
        >
          {session.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Start Time</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatDate(session.availableFrom)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">End Time</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatDate(session.availableTo)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Order Open</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatDate(session.availableForOrder)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Dishes ({session.dishes?.length ?? 0})</h2>
        <div className="divide-y divide-gray-50">
          {session.dishes?.map((d) => (
            <div key={d.dishId} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-700 font-mono">{d.dishId}</span>
              <span className="text-sm text-gray-500">
                Qty: <strong>{d.quantity}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          Meal Templates ({session.mealTemplates?.length ?? 0})
        </h2>
        {session.mealTemplates?.map((template) => (
          <div key={template.id} className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">{template.name}</p>
            <div className="space-y-1.5">
              {template.settings.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-mono text-xs">{s.categoryId.slice(0, 8)}...</span>
                  <span>
                    {s.minQuantity}-{s.maxQuantity}
                  </span>
                  {s.isRequired && (
                    <span className="text-xs text-red-500 font-medium">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pb-8">
        <button
          onClick={() => router.push("/manager/sessions")}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Back to List
        </button>
      </div>
    </div>
  );
}
