"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Calendar, Clock, Trash2, Copy, Coffee } from "lucide-react";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import { cn } from "@/lib/utils";
import Modal from "../_components/modal";
import { NewSessionForm } from "./_components/new-session-form";
import { SessionDetailsContent } from "./_components/session-details-content";

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
  const isSessionLive = (s: SessionListItem) =>
    s.isActive && (!s.availableTo || new Date(s.availableTo) > new Date());

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);

  // Modal & Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copySessionId, setCopySessionId] = useState<string | null>(null);
  const [detailsSessionId, setDetailsSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const result = await sessionService.getSessions({
        pageSize: 100,
        ...(showActive !== null && { isActive: showActive }),
      });
      setSessions(result.items);
    } catch (err) {
      console.error(err);
    }
  };

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
    if (!confirm(`Xóa ca phục vụ "${name}"?`)) return;
    try {
      await sessionService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateNew = () => {
    setCopySessionId(null);
    setIsCreateOpen(true);
  };

  const handleOpenCopy = (id: string) => {
    setCopySessionId(id);
    setIsCreateOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setDetailsSessionId(id);
    setIsDetailsOpen(true);
  };

  const filtered = sessions
    .filter((s) => {
      const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchesActive = showActive === null || isSessionLive(s) === showActive;
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => {
      const aLive = isSessionLive(a);
      const bLive = isSessionLive(b);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return 0;
    });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">Ca phục vụ</h1>
          <p className="text-lg text-gray-500 mt-1.5">
            Quản lý và điều phối các phiên/ca ăn phục vụ.
          </p>
        </div>
        <button
          onClick={handleOpenCreateNew}
          className="shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-[#D35400] text-white rounded-2xl font-black text-base hover:bg-[#b84900] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Ca phục vụ mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm ca ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
          />
        </div>

        <div className="flex bg-gray-100/80 border border-gray-150 rounded-3xl p-1 shrink-0 w-full sm:w-auto">
          {[
            { label: "Tất cả", value: null },
            { label: "Hoạt động", value: true },
            { label: "Đã khóa", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setShowActive(opt.value)}
              className={cn(
                "flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-sm font-black transition-all uppercase tracking-wider text-center",
                showActive === opt.value
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách ca bán...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy ca phục vụ nào.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetails(session.id)}
              className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#D35400] border border-orange-100 shadow-xs shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 truncate tracking-wide">
                    {session.name}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                      isSessionLive(session)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {isSessionLive(session) ? "Hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>

                {session.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 italic px-1">
                    📝 {session.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400 px-1 pt-1">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Bắt đầu: {formatDate(session.availableFrom)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Kết thúc: {formatDate(session.availableTo)}
                  </span>
                  <span className="font-bold text-[#D35400] bg-orange-50 border border-orange-100/40 rounded-xl px-2 py-0.5 text-xs">
                    {session.dishes?.length ?? 0} món
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCopy(session.id);
                  }}
                  className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all shrink-0"
                  title="Sao chép mẫu ca phục vụ"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(session.id);
                  }}
                  className="px-5 py-3 bg-[#D35400]/10 text-[#D35400] rounded-2xl text-sm font-black hover:bg-[#D35400]/25 transition-all uppercase tracking-wider text-center"
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(session.id, session.name);
                  }}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 transition-all shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE SESSION MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={copySessionId ? "Sao chép Ca phục vụ" : "Tạo Ca phục vụ mới"}
        size="full"
      >
        <NewSessionForm
          copyFromId={copySessionId}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchSessions();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* ── SESSION DETAILS MODAL ── */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Chi tiết Ca phục vụ"
        size="full"
      >
        {detailsSessionId && (
          <SessionDetailsContent
            sessionId={detailsSessionId}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
