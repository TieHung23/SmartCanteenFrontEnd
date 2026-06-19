"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
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
          className="px-5 py-2.5 bg-[#D35400] text-white rounded-xl text-sm font-semibold hover:bg-[#b84900] transition-colors shadow-sm"
        >
          + New Session
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] transition-all w-72"
        />
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  From
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  To
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Dishes
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-400">
                    No sessions found.
                  </td>
                </tr>
              )}
              {filtered.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{session.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {session.description}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        session.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(session.availableFrom)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(session.availableTo)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">
                    {session.dishes?.length ?? 0} items
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => router.push(`/manager/sessions/${session.id}`)}
                      className="text-sm text-[#D35400] hover:text-[#b84900] font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id, session.name)}
                      className="text-sm text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
