"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Calendar, Clock, Coffee, Eye, Loader2 } from "lucide-react";
import { sessionService } from "@/services/session.service";
import type { SessionListItem } from "@/types/session.types";
import { cn } from "@/lib/utils";
import Modal from "../../manager/_components/modal";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StaffSessionsPage() {
  const isSessionLive = (s: SessionListItem) => s.isActive;

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);

  // Read-only Session Details Modal
  const [selectedSession, setSelectedSession] = useState<SessionListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenDetailModal = (s: SessionListItem) => {
    setSelectedSession(s);
    setIsModalOpen(true);
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
      return new Date(b.availableFrom || 0).getTime() - new Date(a.availableFrom || 0).getTime();
    });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Block */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Ca Phục Vụ</h1>
          <p className="text-base text-gray-500 mt-1">
            Xem thông tin và chi tiết các phiên/ca ăn phục vụ (Chế độ xem)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm ca ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-3xl outline-none focus:ring-2 focus:ring-[#D35400]/20 focus:border-[#D35400] text-gray-900 placeholder:text-gray-400 transition-all shadow-xs"
          />
        </div>

        <div className="flex bg-gray-100/80 border border-gray-200/80 rounded-3xl p-1 shrink-0 w-full sm:w-auto">
          {[
            { label: "Tất cả", value: null },
            { label: "Hoạt động", value: true },
            { label: "Đã đóng", value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setShowActive(opt.value)}
              className={cn(
                "flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-black transition-all uppercase tracking-wider text-center",
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
          <Loader2 className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin text-[#D35400]" />
          <p className="text-base font-bold text-gray-500">Đang tải danh sách ca phục vụ...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-xs">
          <p className="text-gray-400 font-bold text-base">Không tìm thấy ca phục vụ nào.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetailModal(session)}
              className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3">
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
                    {isSessionLive(session) ? "Hoạt động" : "Đã đóng"}
                  </span>
                </div>

                {session.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 italic px-1">
                    📝 {session.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400 px-1 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Bắt đầu: {formatDate(session.availableFrom)}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Kết thúc: {formatDate(session.availableTo)}
                  </span>
                  <span className="font-bold text-[#D35400] bg-orange-50 border border-orange-100 rounded-xl px-2.5 py-0.5 text-xs">
                    {session.dishes?.length ?? 0} món
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetailModal(session);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-[#D35400] font-bold text-xs rounded-xl hover:bg-[#D35400] hover:text-white transition-all shadow-2xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SESSION DETAIL READ-ONLY MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Chi tiết Ca phục vụ: ${selectedSession?.name || ""}`}
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-6 text-gray-800">
            {/* Header info */}
            <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white p-5 rounded-2xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xl font-black text-gray-900">{selectedSession.name}</h4>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedSession.description || "Phiên phục vụ bữa ăn Smart Canteen."}
                </p>
              </div>

              <span
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto",
                  selectedSession.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                {selectedSession.isActive ? "Hoạt động" : "Đã đóng"}
              </span>
            </div>

            {/* Time Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <span className="font-bold text-gray-400 uppercase">Thời gian bắt đầu:</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">
                  {formatDate(selectedSession.availableFrom)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <span className="font-bold text-gray-400 uppercase">Thời gian kết thúc:</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">
                  {formatDate(selectedSession.availableTo)}
                </p>
              </div>
            </div>

            {/* Dishes list */}
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                Thực đơn món ăn trong ca ({selectedSession.dishes?.length || 0})
              </h5>
              {selectedSession.dishes && selectedSession.dishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSession.dishes.map((dish, i) => (
                    <div
                      key={dish.id || i}
                      className="bg-white border border-gray-200/80 rounded-xl p-3 flex items-center gap-3 shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#D35400] shrink-0 overflow-hidden">
                        {dish.imgUrl ? (
                          <Image
                            src={dish.imgUrl}
                            alt={dish.dishName || "Món"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Coffee className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          {dish.dishName || "Món ăn"}
                        </p>
                        <p className="text-xs text-[#D35400] font-black">
                          {dish.priceAmount ? `${dish.priceAmount.toLocaleString()}đ` : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 text-xs font-bold">
                  Không có danh sách món ăn chi tiết.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
