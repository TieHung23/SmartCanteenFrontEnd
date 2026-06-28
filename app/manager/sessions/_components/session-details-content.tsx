"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Clock, UtensilsCrossed, Layers, Tag, Coffee, AlertCircle } from "lucide-react";
import { sessionService } from "@/services/session.service";
import { categoryService } from "@/services/category.service";
import type { SessionDetail } from "@/types/session.types";
import type { Category } from "@/types/category.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Swal from "sweetalert2";

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

  // New States for Finalization
  const [preparedQuantities, setPreparedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      sessionService.getSessionDetail(sessionId),
      categoryService.getAll().catch(() => ({ items: [] as Category[] })),
    ])
      .then(([sessionData, catResult]) => {
        setSession(sessionData);
        setCategories(catResult.items);

        // Initialize prepared quantities with existing or default 0 values
        const initialQs: Record<string, number> = {};
        (sessionData.dishes || []).forEach((d) => {
          initialQs[d.dishId] = d.preparedQuantity ?? 0;
        });
        setPreparedQuantities(initialQs);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load session details"),
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleQuantityChange = (dishId: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    setPreparedQuantities((prev) => ({
      ...prev,
      [dishId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleFinalize = async () => {
    if (!session) return;

    const result = await Swal.fire({
      title: "Chốt ca phục vụ?",
      text: "Bạn có chắc chắn muốn chốt số lượng cho ca phục vụ này? Hành động này sẽ khóa ca bán và tự động tạo đề xuất đổi món/hoàn tiền cho các đơn hàng bị thiếu.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#D35400",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Chốt ca ăn",
      cancelButtonText: "Hủy",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl border border-gray-150 shadow-md",
        title: "text-lg font-bold text-gray-900",
      },
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const preparedDishes = (session.dishes || []).map((d) => ({
        dishId: d.dishId,
        preparedQuantity: preparedQuantities[d.dishId] ?? 0,
      }));

      await sessionService.finalizeSession(session.id, preparedDishes);
      toast.success("Chốt số lượng món ăn phục vụ thành công!");

      // Refresh data
      const updatedSession = await sessionService.getSessionDetail(session.id);
      setSession(updatedSession);
    } catch {
      toast.error("Lỗi khi thực hiện chốt đơn ca phục vụ.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              session.isActive &&
                (!session.availableTo || new Date(session.availableTo) > new Date())
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-500",
            )}
          >
            {session.isActive &&
            (!session.availableTo || new Date(session.availableTo) > new Date())
              ? "Active"
              : "Inactive"}
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
                    Mở đặt
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

            <div className="flex flex-col gap-2 max-h-[35rem] overflow-y-auto pr-1">
              {session.dishes?.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-gray-150 hover:border-orange-200 transition-all flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="relative w-10 h-10 shrink-0 rounded-lg bg-gray-50 overflow-hidden">
                    {d.imgUrl ? (
                      <Image
                        src={d.imgUrl}
                        alt={d.dishName || ""}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        🍽️
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">
                      {d.dishName || d.dishId.slice(0, 8)}
                    </p>
                    {d.priceAmount !== undefined && (
                      <span className="text-[10px] font-bold text-[#D35400] flex items-center gap-0.5">
                        {d.priceAmount}
                        <div className="relative w-3 h-3">
                          <Image
                            src="/logo_point.png"
                            alt="pts"
                            fill
                            sizes="12px"
                            className="object-contain"
                          />
                        </div>
                      </span>
                    )}
                  </div>

                  {session.isFinalized &&
                  d.preparedQuantity !== null &&
                  d.preparedQuantity !== undefined ? (
                    <span className="text-xs font-bold text-emerald-600 bg-green-50 border border-green-150 px-2.5 py-1 rounded-lg shrink-0">
                      Đã CB: {d.preparedQuantity}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-gray-400">CB:</span>
                      <input
                        type="number"
                        min="0"
                        value={preparedQuantities[d.dishId] ?? 0}
                        onChange={(e) => handleQuantityChange(d.dishId, e.target.value)}
                        disabled={isSubmitting}
                        className="w-16 px-2 py-1.5 text-center border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#D35400] focus:border-[#D35400] text-sm font-bold"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Finalization Action Block */}
            {!session.isFinalized && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-extrabold text-gray-800">
                      Chốt số lượng chuẩn bị nấu
                    </p>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5 leading-relaxed">
                      Nhập số lượng thực tế. Khi chốt đơn, ca ăn sẽ được khóa và hệ thống sẽ tự động
                      tạo đề xuất đổi/hoàn tiền cho khách hàng nếu thiếu số lượng món đã đặt.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-[#D35400] hover:bg-[#b04600] disabled:opacity-50 text-white text-sm font-black rounded-xl transition-all shadow-sm shrink-0 uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Chốt đơn ca ăn"
                  )}
                </button>
              </div>
            )}
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
