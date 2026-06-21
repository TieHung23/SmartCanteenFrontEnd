"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Clock, Trash2, Copy } from "lucide-react";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
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

export default function ManagerSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    sessionService
      .getSessions({
        pageSize: 100,
        ...(showActive !== null && { isActive: showActive }),
      })
      .then((result) => {
        if (!cancelled) setSessions(result.items);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showActive]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete session "${name}"?`)) return;
    try {
      await sessionService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = search
    ? sessions.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serving Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage meal serving sessions</p>
        </div>
        <button
          onClick={() => router.push("/manager/sessions/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { label: "All", value: null },
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setShowActive(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                showActive === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No sessions found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((session) => (
            <div
              key={session.id}
              onClick={() => router.push(`/manager/sessions/${session.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-gray-900 truncate">{session.name}</h3>
                    <span
                      className={cn(
                        "shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        session.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {session.description && (
                    <p className="text-sm text-gray-500 line-clamp-1 mb-3">{session.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(session.availableFrom)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(session.availableTo)}
                    </span>
                    <span className="font-medium">{session.dishes?.length ?? 0} dishes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/manager/sessions/new?copyFrom=${session.id}`);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Copy session"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/manager/sessions/${session.id}`);
                    }}
                    className="px-4 py-2 bg-[#D35400]/10 text-[#D35400] rounded-xl text-sm font-semibold hover:bg-[#D35400]/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id, session.name);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
