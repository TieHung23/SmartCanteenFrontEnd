"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { useCategories } from "@/lib/hooks/useCanteen";
import { sessionService } from "@/services/session.service";
import type { SessionDetail } from "@/types/session.types";
import {
  X,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";

function formatTimeRange(t?: string) {
  if (!t) return "";
  const parts = t.split(" - ");
  if (parts.length < 2) return t;
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(parts[0])} - ${fmt(parts[1])}`;
}

function formatPts(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

export default function CartDrawer() {
  const router = useRouter();

  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    uniqueSessionIds,
    selectedSessionIds,
    toggleSessionSelection,
    selectAllSessions,
    clearSessionSelection,
    removeBySessionId,
  } = useCart();

  const { data: categoriesData } = useCategories();

  // Fetch session details for ALL sessions in cart
  const [allSessionDetails, setAllSessionDetails] = useState<Map<string, SessionDetail>>(new Map());

  useEffect(() => {
    if (uniqueSessionIds.length === 0) return;
    Promise.allSettled(
      uniqueSessionIds.map((sid) =>
        sessionService.getSessionDetail(sid).then((d) => [sid, d] as const),
      ),
    ).then((results) => {
      const map = new Map<string, SessionDetail>();
      const expiredSessionIds: string[] = [];
      const now = new Date();

      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const sid = r.value[0];
          const detail = r.value[1];
          const isExpired =
            new Date(detail.availableTo) < now || !detail.isActive || detail.isFinalized === true;

          if (isExpired) {
            expiredSessionIds.push(sid);
          } else {
            map.set(sid, detail);
          }
        } else {
          // If fetching the session details fails (e.g. 404), mark it as expired/invalid too.
          const sid = uniqueSessionIds[idx];
          if (sid) {
            expiredSessionIds.push(sid);
          }
        }
      });

      setAllSessionDetails(map);

      if (expiredSessionIds.length > 0) {
        expiredSessionIds.forEach((sid) => {
          removeBySessionId(sid);
        });
        toast.warning(
          "Một số món ăn trong giỏ hàng đã được tự động dọn dẹp do ca ăn tương ứng đã kết thúc, hết hạn đặt hàng hoặc đã chốt đơn.",
          { duration: 5000 },
        );
      }
    });
  }, [uniqueSessionIds, removeBySessionId]);

  // Build category name map from API (not just cart items)
  const globalCategoryNames = useMemo(() => {
    const map = new Map<string, string>();
    if (categoriesData?.items) {
      for (const cat of categoriesData.items) {
        map.set(cat.id, cat.name);
      }
    }
    for (const item of cartItems) {
      if (item.categoryId && item.categoryName) map.set(item.categoryId, item.categoryName);
    }
    return map;
  }, [categoriesData, cartItems]);

  // Group sessions with their items, template info, and per-session category max
  const sessionGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        items: typeof cartItems;
        sessionName: string;
        sessionTime: string;
        templateName: string;
        categoryLimits: Map<string, { max: number; current: number }>;
        itemCount: number;
        totalPrice: number;
      }
    >();

    for (const item of cartItems) {
      const sid = item.sessionId || "unknown";
      const existing = groups.get(sid);
      if (existing) {
        existing.items.push(item);
        existing.itemCount += item.quantity;
        existing.totalPrice += item.price * item.quantity;
      } else {
        const sessionItemCount = item.quantity || 1;
        groups.set(sid, {
          items: [item],
          sessionName: item.sessionName || "Unknown",
          sessionTime: formatTimeRange(item.sessionTime),
          templateName: "",
          categoryLimits: new Map(),
          itemCount: sessionItemCount,
          totalPrice: item.price * (item.quantity || 1),
        });
      }
    }

    // Add template + category limits from each session's own detail
    for (const [sid, group] of groups) {
      const detail = allSessionDetails.get(sid);
      if (!detail?.mealTemplates) continue;
      const firstItem = group.items[0];
      const template =
        detail.mealTemplates.find((t) => t.id === firstItem?.sessionTemplateId) ||
        detail.mealTemplates[0];
      if (!template) continue;
      group.templateName = template.name;
      for (const setting of template.settings) {
        const current = group.items
          .filter((i) => i.categoryId === setting.categoryId)
          .reduce((s, i) => s + i.quantity, 0);
        group.categoryLimits.set(setting.categoryId, {
          max: setting.maxQuantity,
          current,
        });
      }
    }

    return groups;
  }, [cartItems, allSessionDetails]);

  const selectedCount = selectedSessionIds.length;
  const hasSelection = selectedCount > 0;
  const allSelected =
    hasSelection && uniqueSessionIds.every((sid) => selectedSessionIds.includes(sid));

  // Compute totals for selected sessions only
  const selectedTotal = useMemo(() => {
    return cartItems
      .filter((i) => i.sessionId && selectedSessionIds.includes(i.sessionId))
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
  }, [cartItems, selectedSessionIds]);

  const selectedItemCount = useMemo(() => {
    return cartItems
      .filter((i) => i.sessionId && selectedSessionIds.includes(i.sessionId))
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [cartItems, selectedSessionIds]);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (selectedCount === 0) {
      toast.error("Chọn ít nhất 1 suất ăn để thanh toán!");
      return;
    }
    if (selectedItemCount === 0) {
      toast.error("Không có món nào trong suất đã chọn!");
      return;
    }
    closeCart();
    router.push(ROUTES.CHECKOUT);
  };

  const handleUpdateQuantity = (item: (typeof cartItems)[0], qty: number) => {
    if (qty <= 0) {
      removeFromCart(item.dishId, item.sessionId);
      return;
    }
    updateQuantity(item.dishId, qty, item.sessionId);
  };

  const catName = (catId: string) => globalCategoryNames.get(catId) || catId.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col animate-slideInRight">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D35400]/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#D35400]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Giỏ hàng</h3>
                <p className="text-sm text-gray-400 font-medium">
                  {cartItems.length} món
                  {uniqueSessionIds.length > 1 ? ` · ${uniqueSessionIds.length} suất` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-session selection bar */}
          {uniqueSessionIds.length > 1 && (
            <div className="mx-8 mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <button
                onClick={allSelected ? clearSessionSelection : selectAllSessions}
                className="flex items-center gap-2 text-sm font-semibold text-amber-700"
              >
                {allSelected ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                )}
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
              <span className="text-xs text-amber-600">
                {selectedCount}/{uniqueSessionIds.length} suất đã chọn
              </span>
            </div>
          )}

          {/* Session Groups */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 stroke-1 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-400">Giỏ hàng trống</p>
                <p className="text-sm text-gray-300">Hãy chọn món từ thực đơn</p>
              </div>
            ) : (
              Array.from(sessionGroups.entries()).map(([sid, group]) => {
                const checked = selectedSessionIds.includes(sid);
                return (
                  <div
                    key={sid}
                    className={`rounded-2xl border-2 transition-all overflow-hidden ${
                      checked
                        ? "border-[#D35400]/20 bg-orange-50/10"
                        : "border-gray-100 bg-white opacity-60"
                    }`}
                  >
                    {/* Session header with checkbox */}
                    <div
                      className={`px-5 py-4 flex items-center gap-3 cursor-pointer ${
                        checked ? "bg-gradient-to-r from-orange-50 to-amber-50" : "bg-gray-50"
                      }`}
                      onClick={() => toggleSessionSelection(sid)}
                    >
                      <div className="shrink-0">
                        {checked ? (
                          <CheckSquare className="w-5 h-5 text-[#D35400]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#D35400] shrink-0" />
                          <span className="text-sm font-bold text-gray-700 truncate">
                            {group.sessionName}
                          </span>
                          {group.sessionTime && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {group.sessionTime}
                            </span>
                          )}
                        </div>
                        {group.templateName && (
                          <p className="text-xs text-gray-500 font-medium mt-0.5 ml-6">
                            {group.templateName}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#D35400] flex items-center justify-end gap-1">
                          <span>{formatPts(group.totalPrice)}</span>
                          <Image
                            src="/logo_point.png"
                            alt="coin"
                            width={14}
                            height={14}
                            className="object-contain"
                          />
                        </p>
                        <p className="text-[10px] text-gray-400">{group.itemCount} món</p>
                      </div>
                    </div>

                    {/* Category limit badges */}
                    {group.categoryLimits.size > 0 && (
                      <div className="px-5 py-3 flex flex-wrap gap-1.5 border-b border-gray-50">
                        {Array.from(group.categoryLimits.entries()).map(([catId, limit]) => {
                          const isFull = limit.current >= limit.max;
                          return (
                            <span
                              key={catId}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${
                                isFull
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : "bg-white border-gray-200 text-gray-500"
                              }`}
                            >
                              {catName(catId)}
                              <span className="font-black">
                                {limit.current}/{limit.max}
                              </span>
                              {isFull && <AlertTriangle className="w-2.5 h-2.5" />}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Items in this session */}
                    <div className="divide-y divide-gray-50">
                      {group.items.map((item) => {
                        const catLimit = item.categoryId
                          ? group.categoryLimits.get(item.categoryId)
                          : undefined;
                        const catCurrent = catLimit
                          ? group.items
                              .filter((i) => i.categoryId === item.categoryId)
                              .reduce((s, i) => s + i.quantity, 0)
                          : 0;
                        const atMax = catLimit ? catCurrent >= catLimit.max : false;

                        return (
                          <div
                            key={item.dishId + sid}
                            className="flex gap-4 px-5 py-3 hover:bg-orange-50/30 transition-colors"
                          >
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                              <Image
                                src={item.imgUrl || "/placeholder-user.png"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-800 truncate">
                                  {item.name}
                                  {atMax && (
                                    <span className="ml-1 text-[10px] text-red-500 font-bold">
                                      (đã đạt tối đa)
                                    </span>
                                  )}
                                </h4>
                                {item.categoryName && (
                                  <p className="text-[10px] text-gray-400 font-medium">
                                    {item.categoryName}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg">
                                  <button
                                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="p-1 rounded-md text-gray-400 hover:text-[#D35400] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="px-2 text-xs font-bold text-gray-700 min-w-[20px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (atMax) {
                                        toast.error(
                                          `Danh mục "${item.categoryName || ""}" chỉ được tối đa ${catLimit?.max} món.`,
                                        );
                                        return;
                                      }
                                      handleUpdateQuantity(item, item.quantity + 1);
                                    }}
                                    disabled={atMax}
                                    className="p-1 rounded-md text-gray-400 hover:text-[#D35400] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-sm font-bold text-[#D35400] min-w-[70px] text-right flex items-center justify-end gap-1">
                                  <span>{formatPts(item.price * item.quantity)}</span>
                                  <Image
                                    src="/logo_point.png"
                                    alt="coin"
                                    width={12}
                                    height={12}
                                    className="object-contain"
                                  />
                                </span>
                                <button
                                  onClick={() => removeFromCart(item.dishId, item.sessionId)}
                                  className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-100 bg-white space-y-3 shadow-[0_-8px_30px_rgb(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedItemCount}/{cartItems.length} món
                    {uniqueSessionIds.length > 1 && (
                      <span className="text-amber-500 ml-1">
                        · {selectedCount}/{uniqueSessionIds.length} suất
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-2xl font-black text-[#D35400] flex items-center gap-1.5">
                  <span>{formatPts(selectedTotal)}</span>
                  <Image
                    src="/logo_point.png"
                    alt="coin"
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!hasSelection}
                className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-base rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Thanh toán ({selectedCount} suất)
              </button>
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `,
        }}
      />
    </div>
  );
}
