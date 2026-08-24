"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  XCircle,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { sessionService } from "@/services/session.service";
import type { SessionDishInfo } from "@/types/session.types";
import { changeProposalService } from "@/services/change-proposal.service";
import { translateApiMessage } from "@/lib/utils";
import type { ChangeProposalDetail } from "@/types/order.types";

interface SwapDishModalProps {
  proposal: ChangeProposalDetail | null;
  sessionId: string;
  itemUnitPrice?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapSuccess: () => void;
  onRequestRefund?: () => void;
  onRequestOrderRefund?: () => void;
}

export function SwapDishModal({
  proposal,
  sessionId,
  itemUnitPrice,
  isOpen,
  onClose,
  onSwapSuccess,
  onRequestRefund,
  onRequestOrderRefund,
}: SwapDishModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [candidateDishes, setCandidateDishes] = useState<SessionDishInfo[]>([]);
  const [targetPrice, setTargetPrice] = useState<number | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!proposal || !sessionId) return;
    setLoading(true);
    try {
      const session = await sessionService.getSessionDetail(sessionId);
      const allDishes = session.dishes || [];

      const currentSessionDish = allDishes.find(
        (d) => d.dishId?.toLowerCase() === proposal.currentDishId?.toLowerCase(),
      );

      // Charged price priority: proposal.currentUnitPrice -> itemUnitPrice -> currentSessionDish.priceAmount
      const chargedPrice =
        proposal.currentUnitPrice ?? itemUnitPrice ?? currentSessionDish?.priceAmount ?? null;
      setTargetPrice(chargedPrice);

      // Target category logic:
      // If isRequiredItem = true, proposal.requiredCategoryId is expected.
      // If isRequiredItem = false, category should match the dish being replaced.
      const categoryConstraint = proposal.requiredCategoryId || currentSessionDish?.categoryId;

      const filtered = allDishes.filter((d) => {
        const isDifferentDish = d.dishId?.toLowerCase() !== proposal.currentDishId?.toLowerCase();
        const isPrepared =
          d.preparedQuantity !== 0 &&
          d.preparedQuantity !== null &&
          d.preparedQuantity !== undefined;

        // Must match category if category constraint exists
        const matchesCategory = categoryConstraint ? d.categoryId === categoryConstraint : true;

        // MUST cost exactly what the customer was charged (chargedPrice)
        const matchesPrice =
          chargedPrice !== null && chargedPrice !== undefined
            ? d.priceAmount === chargedPrice
            : true;

        return isDifferentDish && isPrepared && matchesCategory && matchesPrice;
      });

      setCandidateDishes(filtered);
    } catch {
      toast.error("Không thể tải danh sách món ăn thay thế.");
      setCandidateDishes([]);
    } finally {
      setLoading(false);
    }
  }, [proposal, sessionId, itemUnitPrice]);

  useEffect(() => {
    if (isOpen && proposal) {
      const timer = setTimeout(() => {
        fetchCandidates();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCandidateDishes([]);
        setTargetPrice(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, proposal, fetchCandidates]);

  if (!isOpen || !proposal) return null;

  const handleConfirmSwap = async (newDishId: string) => {
    setIsSwapping(true);
    try {
      await changeProposalService.accept(proposal.id, newDishId);
      toast.success("Đổi món thành công!");
      onSwapSuccess();
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const raw = axiosErr?.response?.data?.message;
      toast.error(raw ? translateApiMessage(raw) : "Lỗi khi thực hiện đổi món.");
    } finally {
      setIsSwapping(false);
    }
  };

  const renderPoints = (amount?: number | null) => {
    if (amount === null || amount === undefined) return null;
    return (
      <span className="inline-flex items-center gap-1 font-mono font-black text-[#D35400]">
        <span>{new Intl.NumberFormat("vi-VN").format(amount)}</span>
        <Image
          src="/logo_point.png"
          alt="coin"
          width={16}
          height={16}
          className="object-contain inline-block shrink-0"
        />
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D35400] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Chọn Món Thay Thế
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs sm:text-sm text-slate-600 font-medium">
              <span>Đổi món:</span>
              <span className="font-extrabold text-slate-900 bg-white/80 border border-slate-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {proposal.currentDishName}
              </span>
              {targetPrice !== null && (
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 bg-white border border-orange-200/80 px-2.5 py-0.5 rounded-lg text-xs sm:text-sm shadow-2xs">
                  <span>Mức điểm đã mua:</span>
                  {renderPoints(targetPrice)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <Loader2 className="w-8 h-8 animate-spin text-[#D35400]" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Đang tìm danh sách món ăn cùng điểm...
              </p>
            </div>
          ) : candidateDishes.length === 0 ? (
            <div className="py-6 px-5 sm:px-6 bg-gradient-to-b from-amber-50/90 to-orange-50/40 border border-amber-200/90 rounded-3xl text-center space-y-5 shadow-xs">
              <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  Không có món ăn cùng điểm khả dụng
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-md mx-auto">
                  Theo quy định của căng tin, món mới phải có{" "}
                  <span className="font-black text-slate-900 underline underline-offset-2">
                    cùng số điểm
                  </span>{" "}
                  với món ban đầu ({renderPoints(targetPrice)}). Trong ca ăn này hiện không có món
                  nào cùng điểm đáp ứng điều kiện.
                </p>
              </div>

              {/* Action Fallbacks */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-col gap-2.5">
                <p className="text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-200/60 py-1 px-3 rounded-full w-fit mx-auto">
                  Vui lòng chọn giải pháp hoàn điểm:
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {!proposal.isRequiredItem && onRequestRefund && (
                    <button
                      onClick={() => {
                        onClose();
                        onRequestRefund();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Hoàn điểm món này</span>
                    </button>
                  )}

                  {onRequestOrderRefund && (
                    <button
                      onClick={() => {
                        onClose();
                        onRequestOrderRefund();
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Hoàn điểm toàn bộ đơn hàng</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 font-semibold px-1">
                <span>Món ăn khả dụng ({candidateDishes.length})</span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-xl">
                  <span>Yêu cầu cùng điểm:</span>
                  {renderPoints(targetPrice)}
                </span>
              </div>

              <div className="grid gap-3">
                {candidateDishes.map((dish) => (
                  <div
                    key={dish.dishId}
                    onClick={() => !isSwapping && handleConfirmSwap(dish.dishId)}
                    className="flex items-center justify-between p-4 bg-white hover:bg-orange-50/40 hover:border-orange-200 border border-slate-200/80 rounded-2xl cursor-pointer transition-all shadow-2xs hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3.5">
                      {dish.imgUrl ? (
                        <Image
                          src={dish.imgUrl}
                          alt={dish.dishName || "Món ăn"}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100 shadow-2xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#D35400] flex items-center justify-center font-bold text-xl shrink-0">
                          🍲
                        </div>
                      )}
                      <div>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#D35400] transition-colors">
                          {dish.dishName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {dish.priceAmount !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                              {renderPoints(dish.priceAmount)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cùng điểm
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#D35400] to-amber-500 hover:from-[#b04600] hover:to-amber-600 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs shadow-orange-500/20 group-hover:shadow-orange-500/35">
                      {isSwapping ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <span>Đổi món</span>
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
