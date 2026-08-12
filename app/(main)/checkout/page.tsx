"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isAxiosError } from "axios";
import Navbar from "@/components/layout/Navbar";
import { useCart, type CartItem } from "@/context/cart-context";
import { orderService } from "@/services/order.service";
import { paymentService, type TopUpRequest, type TopUpResponse } from "@/services/payment.service";
import { userService, type UserProfileResponse } from "@/services/user.service";
import { sessionService } from "@/services/session.service";
import { useCategories } from "@/lib/hooks/useCanteen";
import { ROUTES } from "@/config/routes";
import type { SessionDetail } from "@/types/session.types";
import Link from "next/link";
import { toast } from "sonner";
import { useSignalr } from "@/lib/hooks/use-signalr";
import type { NotificationItem } from "@/types/notification.types";
import {
  ArrowLeft,
  ShoppingBag,
  Wallet,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
  PartyPopper,
  Receipt,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Copy,
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: 4, name: "Chuyển khoản ngân hàng" },
  { id: 5, name: "Ví Smart Canteen" },
];

const COMING_SOON_METHODS = ["Momo", "VNPay", "ZaloPay"];

function formatPts(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function PtsDisplay({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className || ""}`}>
      <span>{formatPts(amount)}</span>
      <Image src="/logo_point.png" alt="pts" width={18} height={18} className="object-contain" />
    </span>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: categoriesData } = useCategories();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    selectedSessionIds,
    uniqueSessionIds,
    ensureSynced,
    isSyncing,
  } = useCart();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmountStr, setTopUpAmountStr] = useState("50000");
  const topUpAmount = useMemo(() => Number(topUpAmountStr) || 0, [topUpAmountStr]);
  const [topUpMethod, setTopUpMethod] = useState(4);
  const [isTopUpping, setIsTopUpping] = useState(false);
  const [topUpResult, setTopUpResult] = useState<TopUpResponse | null>(null);
  const [orderResult, setOrderResult] = useState<{
    id: string;
    transactionId: string;
    totalPrice: number;
    message: string;
    userRemainingBalance: number;
  } | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Map<string, SessionDetail>>(new Map());
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Use selectedSessionIds from cart, fall back to all unique session IDs
  const activeSessionIds = useMemo(
    () => (selectedSessionIds.length > 0 ? selectedSessionIds : uniqueSessionIds),
    [selectedSessionIds, uniqueSessionIds],
  );

  const expiredSessions = useMemo(() => {
    if (isLoadingDetails) return [];
    const expiredList: { id: string; name: string; isInvalid?: boolean }[] = [];
    for (const sid of activeSessionIds) {
      const detail = sessionDetails.get(sid);
      if (!detail) {
        const sessionItems = cartItems.filter((i) => i.sessionId === sid);
        const sessionName = sessionItems[0]?.sessionName || sid.slice(0, 8);
        expiredList.push({ id: sid, name: sessionName, isInvalid: true });
      } else {
        const isExpired =
          new Date(detail.availableTo) < new Date() ||
          !detail.isActive ||
          detail.isFinalized === true;
        if (isExpired) {
          expiredList.push({ id: sid, name: detail.name });
        }
      }
    }
    return expiredList;
  }, [activeSessionIds, sessionDetails, isLoadingDetails, cartItems]);

  useEffect(() => {
    if (!orderResult && cartItems.length === 0) {
      router.push(ROUTES.SESSION);
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile();
        setProfile(res);
      } catch {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [cartItems, router, orderResult]);

  useEffect(() => {
    if (activeSessionIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingDetails(false);
      return;
    }
    setIsLoadingDetails(true);
    Promise.allSettled(
      activeSessionIds.map((sid) =>
        sessionService.getSessionDetail(sid).then((d) => [sid, d] as const),
      ),
    ).then((results) => {
      const map = new Map<string, SessionDetail>();
      for (const r of results) {
        if (r.status === "fulfilled") map.set(r.value[0], r.value[1]);
      }
      setSessionDetails(map);
      setIsLoadingDetails(false);
    });
  }, [activeSessionIds]);

  const activeCartItems = useMemo(
    () => cartItems.filter((i) => i.sessionId && activeSessionIds.includes(i.sessionId)),
    [cartItems, activeSessionIds],
  );

  const totalPoints = activeCartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const balance = profile?.balanceAmount ?? 0;
  const hasEnoughPoints = balance >= totalPoints;
  const neededPoints = Math.max(0, totalPoints - balance);
  const accountStatus = profile?.status ?? 0;
  const isBlocked = accountStatus === 3 || accountStatus === 4 || accountStatus === 5;
  const isLoadingChecks = profile === null;

  function getCategoryMaxForSession(sessionId: string): Map<string, number> {
    const detail = sessionDetails.get(sessionId);
    const map = new Map<string, number>();
    if (!detail?.mealTemplates) return map;
    for (const template of detail.mealTemplates) {
      for (const setting of template.settings) {
        const existing = map.get(setting.categoryId) ?? Infinity;
        map.set(setting.categoryId, Math.min(existing, setting.maxQuantity));
      }
    }
    return map;
  }

  const sessionGroupedItems = useMemo(() => {
    const groups = new Map<string, Map<string, CartItem[]>>();
    for (const item of activeCartItems) {
      const sid = item.sessionId || "__nosession__";
      if (!groups.has(sid)) groups.set(sid, new Map());
      const catMap = groups.get(sid)!;
      const catId = item.categoryId || "__unknown__";
      if (!catMap.has(catId)) catMap.set(catId, []);
      catMap.get(catId)!.push(item);
    }
    return groups;
  }, [activeCartItems]);

  const sessionLabels = useMemo(() => {
    const grouped = new Map<string, string>();
    for (const item of activeCartItems) {
      if (item.sessionId && item.sessionName && !grouped.has(item.sessionId)) {
        grouped.set(item.sessionId, item.sessionName);
      }
    }
    return Array.from(grouped.values());
  }, [activeCartItems]);

  function formatTimeRange(t?: string) {
    if (!t) return "";
    const parts = t.split(" - ");
    if (parts.length < 2) return t;
    const fmt = (s: string) => {
      const d = new Date(s);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };
    return `${fmt(parts[0])} - ${fmt(parts[1])}`;
  }

  const handleCreateOrder = useCallback(async () => {
    if (activeSessionIds.length === 0) return;
    setIsSubmitting(true);
    try {
      // Ensure cart is synced to server and get current version
      const version = await ensureSynced(true);
      if (version === null) {
        toast.error("Không thể đồng bộ giỏ hàng. Vui lòng thử lại.");
        setIsSubmitting(false);
        return;
      }

      // Create order for each session (server reads persisted cart)
      let lastVersion = version;
      let firstResult: typeof orderResult = null;

      for (const sid of activeSessionIds) {
        const result = await orderService.createOrder(sid, lastVersion);
        if (!firstResult) firstResult = result;
        lastVersion = result.cartVersion ?? lastVersion + 1;
      }

      clearCart();
      setOrderResult(firstResult);
      const sessionCount = activeSessionIds.length;
      toast.success(
        sessionCount > 1
          ? `Đã đặt ${sessionCount} suất ăn thành công!`
          : firstResult?.message || "Đặt hàng thành công!",
      );
    } catch (error: unknown) {
      const msg = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Order failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeSessionIds, ensureSynced, clearCart]);

  const handleTopUp = useCallback(async () => {
    if (topUpAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    setIsTopUpping(true);
    try {
      const data: TopUpRequest = { amountVnd: topUpAmount, method: topUpMethod };
      const result = await paymentService.topUpWallet(data);
      setTopUpResult(result);
      toast.success("Tạo yêu cầu nạp tiền thành công!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Top-up failed");
    } finally {
      setIsTopUpping(false);
    }
  }, [topUpAmount, topUpMethod]);

  const handleRetryCheckout = async () => {
    try {
      const res = await userService.getProfile();
      setProfile(res);
      if (res && res.balanceAmount >= totalPoints) {
        handleCreateOrder();
      } else {
        toast.error(
          res
            ? `Số dư không đủ. Bạn có ${res.balanceAmount} điểm, cần ${totalPoints} điểm.`
            : "Không thể kiểm tra số dư. Vui lòng thử lại.",
        );
      }
    } catch {
      toast.error("Không thể kiểm tra số dư. Vui lòng thử lại.");
    }
  };

  const retryCheckoutRef = useRef(handleRetryCheckout);

  const totalPointsRef = useRef(totalPoints);

  useEffect(() => {
    retryCheckoutRef.current = handleRetryCheckout;
  });

  useEffect(() => {
    totalPointsRef.current = totalPoints;
  });

  const { connect: connectSignalr, disconnect: disconnectSignalr } = useSignalr(
    useCallback((notification: NotificationItem) => {
      if (notification.type === "Payment.Completed") {
        toast.success("Nạp tiền thành công! Đang kiểm tra số dư...");
        setTopUpResult(null);
        setIsTopUpOpen(false);
        userService
          .getProfile()
          .then((res) => {
            setProfile(res);
            if (res && res.balanceAmount >= totalPointsRef.current) {
              toast.success("Đủ số dư! Tiến hành đặt hàng...");
              setTimeout(() => retryCheckoutRef.current(), 500);
            }
          })
          .catch(() => toast.error("Không thể kiểm tra số dư"));
      }
    }, []),
  );

  useEffect(() => {
    if (isTopUpOpen) {
      connectSignalr();
    } else {
      disconnectSignalr();
    }
    return () => {
      disconnectSignalr();
    };
  }, [isTopUpOpen, connectSignalr, disconnectSignalr]);

  const [fireworkParticles] = useState(() => {
    const COLORS = [
      "#D35400",
      "#FF6B35",
      "#FFD700",
      "#FF4444",
      "#FF8C42",
      "#FFA07A",
      "#FFFFFF",
      "#00FF88",
      "#00BFFF",
      "#FF69B4",
      "#FF4500",
      "#ADFF2F",
      "#FF00FF",
      "#00FFFF",
      "#FF1493",
      "#7B68EE",
      "#FFD700",
      "#32CD32",
    ];
    const particles: {
      id: number;
      color: string;
      x: number;
      delay: number;
      size: number;
      duration: number;
    }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: i,
        color: COLORS[i % COLORS.length],
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        size: 4 + Math.random() * 8,
        duration: 1.2 + Math.random() * 1.2,
      });
    }
    return particles;
  });

  if (orderResult) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Background image with dark overlay + blur */}
          <div className="absolute inset-0">
            <Image src="/uni1.webp" alt="" fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />
          </div>

          {/* Firework particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {fireworkParticles.map((p) => (
              <div
                key={p.id}
                className="absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  left: `${50 + (p.x - 50) * 0.3}%`,
                  animation: `fireworkLaunch ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
                  opacity: 0,
                  boxShadow: `0 0 ${p.size}px ${p.color}80`,
                }}
              />
            ))}
          </div>

          <div className="max-w-lg w-full relative z-10">
            <div className="bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(211,84,0,0.25)] border border-orange-200/50 p-10 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200/50">
                  <PartyPopper className="w-12 h-12 text-[#D35400]" />
                </div>
                <div className="absolute -top-1 -right-1 w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Đặt hàng thành công!</h1>
              <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">{orderResult.message}</p>

              <div className="bg-gradient-to-br from-orange-50 to-orange-50/30 rounded-2xl p-6 space-y-4 text-left mb-8 border border-orange-100/40">
                <div className="flex items-center gap-3 pb-3 border-b border-orange-100/30">
                  <div className="w-8 h-8 bg-[#D35400]/10 rounded-lg flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-[#D35400]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Hóa đơn đơn hàng</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mã đơn hàng</span>
                  <span className="font-mono font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                    {orderResult.id.slice(0, 12)}...
                  </span>
                </div>
                {orderResult.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mã giao dịch</span>
                    <span className="font-mono font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                      {orderResult.transactionId.slice(0, 12)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phương thức thanh toán</span>
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#D35400]" /> Điểm ví
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-orange-100/30">
                  <span className="text-base font-bold text-gray-800">Tổng đã thanh toán</span>
                  <PtsDisplay
                    amount={orderResult.totalPrice}
                    className="text-lg font-black text-[#D35400]"
                  />
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Số dư còn lại</span>
                  <PtsDisplay
                    amount={orderResult.userRemainingBalance}
                    className="font-bold text-[#D35400]"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    clearCart();
                    router.push(ROUTES.ORDERS);
                  }}
                  className="flex-1 py-3.5 bg-[#D35400] text-white font-bold text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-[0_4px_12px_rgba(211,84,0,0.25)] active:scale-[0.98]"
                >
                  Xem đơn hàng
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    router.push(ROUTES.SESSION);
                  }}
                  className="flex-1 py-3.5 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all active:scale-[0.98]"
                >
                  Chọn phiên ăn
                </button>
              </div>
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes fireworkLaunch {
              0% { transform: translateY(0) scale(0.5); opacity: 1; }
              40% { transform: translateY(-160px) scale(1.5); opacity: 0.9; }
              100% { transform: translateY(-350px) scale(0); opacity: 0; }
            }
          `,
            }}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-10 px-4 sm:px-8">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-orange-100/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                <ShoppingBag className="w-5 h-5 text-[#D35400]" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-800">Thanh toán</h1>
                {sessionLabels.length > 0 && (
                  <p
                    suppressHydrationWarning
                    className="text-xs font-bold text-orange-500 mt-0.5 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {sessionLabels.join(", ")}
                    {sessionLabels.length > 1 && (
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[9px]">
                        {sessionLabels.length} suất
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {activeSessionIds.length > 0 && (
            <div className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-700">Thông tin suất ăn & hạn mức</span>
                {activeSessionIds.length > 1 && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full ml-auto">
                    {activeSessionIds.length} suất
                  </span>
                )}
                {uniqueSessionIds.length > activeSessionIds.length && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {uniqueSessionIds.length - activeSessionIds.length} suất bỏ qua
                  </span>
                )}
              </div>
              {activeSessionIds.map((sid) => {
                const detail = sessionDetails.get(sid);
                const sessionItems = cartItems.filter((i) => i.sessionId === sid);
                const sessionName = sessionItems[0]?.sessionName || sid.slice(0, 8);
                if (isLoadingDetails) {
                  return (
                    <div key={sid} className="text-xs text-gray-400 italic">
                      Đang tải cấu hình cho &ldquo;{sessionName}&rdquo;...
                    </div>
                  );
                }
                if (!detail?.mealTemplates?.length) {
                  return (
                    <div
                      key={sid}
                      className="text-xs text-red-500 font-semibold p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between"
                    >
                      <span>Phiên ăn &ldquo;{sessionName}&rdquo; không hợp lệ hoặc đã bị xóa.</span>
                      <button
                        onClick={() => {
                          const itemsToRemove = cartItems.filter((i) => i.sessionId === sid);
                          itemsToRemove.forEach((i) => removeFromCart(i.dishId, sid));
                          toast.success("Đã xóa phiên ăn không hợp lệ.");
                        }}
                        className="text-xs font-bold text-red-700 underline hover:text-red-900 ml-2"
                      >
                        Xóa
                      </button>
                    </div>
                  );
                }
                return detail.mealTemplates.map((template) => {
                  const templateUsed = sessionItems.some(
                    (i) => i.sessionTemplateId === template.id,
                  );
                  if (!templateUsed) return null;
                  return (
                    <div key={template.id} className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500">
                          {sessionName} — {template.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {template.settings.map((setting) => {
                          const catName =
                            sessionItems.find((i) => i.categoryId === setting.categoryId)
                              ?.categoryName ||
                            categoriesData?.items?.find((c) => c.id === setting.categoryId)?.name ||
                            setting.categoryId;
                          const current = sessionItems
                            .filter((i) => i.categoryId === setting.categoryId)
                            .reduce((s, i) => s + i.quantity, 0);
                          const isFull = current >= setting.maxQuantity;
                          const isMissing = setting.isRequired && current < setting.minQuantity;
                          return (
                            <div
                              key={setting.categoryId}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                                isFull
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : isMissing
                                    ? "bg-orange-50 border-orange-200 text-orange-600"
                                    : "bg-white border-gray-200 text-gray-600"
                              }`}
                            >
                              <span>{catName}</span>
                              <span className="font-black">
                                {current}/{setting.maxQuantity}
                              </span>
                              {isFull && <AlertTriangle className="w-3 h-3" />}
                              {setting.isRequired &&
                                current > 0 &&
                                current < setting.minQuantity && (
                                  <span className="text-[9px] font-bold uppercase text-orange-500 ml-0.5">
                                    Thiếu
                                  </span>
                                )}
                              {setting.isRequired && (
                                <span className="text-[9px] font-bold uppercase text-blue-500 ml-0.5">
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              {Array.from(sessionGroupedItems.entries()).map(([sid, catMap]) => {
                const detail = sessionDetails.get(sid);
                const sessionItems = activeCartItems.filter((i) => i.sessionId === sid);
                const sessionName = sessionItems[0]?.sessionName || sid.slice(0, 8);
                const sessionTime = sessionItems[0]?.sessionTime;
                const selectedTmplId = sessionItems[0]?.sessionTemplateId;
                const template = selectedTmplId
                  ? detail?.mealTemplates?.find((t) => t.id === selectedTmplId)
                  : detail?.mealTemplates?.[0];
                const templateName = template?.name || "";
                const sessionTotal = sessionItems.reduce((s, i) => s + i.price * i.quantity, 0);
                const isExpired = detail
                  ? new Date(detail.availableTo) < new Date() ||
                    !detail.isActive ||
                    detail.isFinalized === true
                  : !isLoadingDetails;

                return (
                  <div
                    key={sid}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                      isExpired ? "border-red-200" : "border-gray-100"
                    }`}
                  >
                    {/* Session Header */}
                    <div
                      className={`px-5 py-4 border-b transition-colors ${
                        isExpired
                          ? "bg-red-50/80 border-red-100"
                          : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">{sessionName}</h3>
                            {isExpired && (
                              <span className="text-[10px] font-extrabold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                {detail?.isFinalized ? "Đã chốt đơn" : "Hết hạn đặt"}
                              </span>
                            )}
                          </div>
                          {templateName && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {templateName}
                            </p>
                          )}
                          {sessionTime && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatTimeRange(sessionTime)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <PtsDisplay amount={sessionTotal} className="font-bold text-[#D35400]" />
                          <p className="text-[10px] text-gray-400">
                            {sessionItems.reduce((s, i) => s + i.quantity, 0)} món
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Category groups within this session */}
                    <div className="p-5 space-y-5">
                      {Array.from(catMap.entries()).map(([catId, items]) => {
                        const catMax = getCategoryMaxForSession(sid).get(catId);
                        const catItemCount = items.reduce((s, i) => s + i.quantity, 0);
                        const isAtCatMax = catMax !== undefined && catItemCount >= catMax;

                        return (
                          <div key={catId}>
                            <div className="flex items-center justify-between px-1 mb-3">
                              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                {items[0]?.categoryName || "Other"}
                              </span>
                              {catMax !== undefined && (
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                                    isAtCatMax
                                      ? "bg-red-50 text-red-500"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  Đã chọn: {catItemCount}/{catMax}
                                </span>
                              )}
                            </div>
                            <div className="space-y-3">
                              {items.map((item) => {
                                const isAtMax = isAtCatMax;
                                return (
                                  <div
                                    key={item.dishId}
                                    className={`flex gap-5 p-5 rounded-2xl bg-white border transition-all ${
                                      isAtMax
                                        ? "border-red-200 bg-red-50/10"
                                        : "border-gray-50 shadow-sm hover:border-orange-100 hover:shadow-md"
                                    }`}
                                  >
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                                      <Image
                                        src={item.imgUrl || "/placeholder-food.png"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-semibold text-gray-800 truncate">
                                        {item.name}
                                        {isAtMax && (
                                          <span className="ml-1.5 text-[10px] text-red-500 font-bold">
                                            (đã đạt tối đa)
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                        <PtsDisplay amount={item.price} /> mỗi món
                                      </p>
                                      <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-gray-200 bg-gray-50 rounded-xl">
                                          <button
                                            onClick={() =>
                                              updateQuantity(
                                                item.dishId,
                                                item.quantity - 1,
                                                item.sessionId,
                                              )
                                            }
                                            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-[#D35400] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={item.quantity <= 1}
                                          >
                                            <Minus className="w-4 h-4" />
                                          </button>
                                          <span className="px-4 text-sm font-bold text-gray-700 min-w-[28px] text-center">
                                            {item.quantity}
                                          </span>
                                          <button
                                            onClick={() => {
                                              if (isAtMax) {
                                                toast.error(
                                                  `Tối đa ${catMax} món cho danh mục này.`,
                                                );
                                                return;
                                              }
                                              updateQuantity(
                                                item.dishId,
                                                item.quantity + 1,
                                                item.sessionId,
                                              );
                                            }}
                                            disabled={isAtMax}
                                            className={`p-2 rounded-lg text-gray-500 hover:bg-white hover:text-[#D35400] transition-colors ${
                                              isAtMax ? "opacity-30 cursor-not-allowed" : ""
                                            }`}
                                          >
                                            <Plus className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <div className="text-base font-bold text-[#D35400]">
                                          <PtsDisplay amount={item.price * item.quantity} />
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.dishId, item.sessionId)}
                                      className="self-start p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#D35400]" />
                  </div>
                  <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                    Tổng kết thanh toán
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">
                      Món ăn ({activeCartItems.length})
                    </span>
                    <PtsDisplay amount={totalPoints} className="font-bold text-gray-800" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Số dư của bạn</span>
                    <PtsDisplay amount={balance} className="font-bold text-[#D35400]" />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">
                        Phương thức thanh toán
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-orange-50/60 px-3 py-1.5 rounded-xl border border-orange-100/40">
                        <Wallet className="w-3.5 h-3.5 text-[#D35400]" /> Ví điện tử
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-800">Tổng tiền</span>
                      <PtsDisplay
                        amount={totalPoints}
                        className="font-black text-[#D35400] text-xl"
                      />
                    </div>
                  </div>
                </div>
                {expiredSessions.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <p className="text-sm font-bold text-red-800">
                          Giỏ hàng có phiên ăn hết hạn
                        </p>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">
                          Phiên ăn <strong>{expiredSessions.map((s) => s.name).join(", ")}</strong>{" "}
                          đã quá hạn đặt hàng hoặc không còn hoạt động. Vui lòng loại bỏ để tiếp tục
                          thanh toán.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        expiredSessions.forEach((es) => {
                          const itemsToRemove = cartItems.filter((i) => i.sessionId === es.id);
                          itemsToRemove.forEach((i) => removeFromCart(i.dishId, es.id));
                        });
                        toast.success("Đã xóa các phiên ăn hết hạn khỏi giỏ hàng.");
                      }}
                      className="self-start text-xs font-bold text-red-700 underline hover:text-red-900 mt-1"
                    >
                      Xóa nhanh các món hết hạn
                    </button>
                  </div>
                )}

                {isBlocked ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-800">
                          {accountStatus === 3 ? "Chưa định danh tài khoản" : "Tài khoản bị khóa"}
                        </p>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">
                          {accountStatus === 3
                            ? "Bạn cần hoàn tất định danh tài khoản trước khi có thể đặt hàng."
                            : "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href={ROUTES.PROFILE}
                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl text-center transition-all"
                      >
                        Đến trang cá nhân
                      </Link>
                      {accountStatus === 3 && (
                        <Link
                          href={ROUTES.VERIFICATION}
                          className="flex-1 py-3.5 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl text-center transition-all shadow-md"
                        >
                          Định danh ngay
                        </Link>
                      )}
                    </div>
                  </div>
                ) : isLoadingChecks ? (
                  <button
                    disabled
                    className="w-full py-4 bg-gray-300 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
                  </button>
                ) : hasEnoughPoints ? (
                  <button
                    onClick={handleCreateOrder}
                    disabled={isSubmitting || isSyncing || expiredSessions.length > 0}
                    className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting || isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" /> Thanh toán{" "}
                        <PtsDisplay amount={totalPoints} className="text-white" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-[#B34700]">Số dư không đủ</p>
                        <p className="text-xs text-orange-500 mt-1 flex items-center gap-1 flex-wrap">
                          Bạn cần thêm{" "}
                          <PtsDisplay amount={neededPoints} className="font-bold text-[#D35400]" />{" "}
                          để hoàn tất đơn hàng. Vui lòng nạp thêm.
                        </p>
                      </div>
                    </div>

                    {!isTopUpOpen ? (
                      <button
                        onClick={() => {
                          setTopUpAmountStr(String(Math.max(10000, neededPoints * 1000)));
                          setIsTopUpOpen(true);
                        }}
                        disabled={expiredSessions.length > 0}
                        className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Nạp tiền &amp; Thanh toán
                      </button>
                    ) : (
                      <div className="space-y-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 animate-fadeIn">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                          Nạp tiền vào ví
                        </h3>

                        {topUpResult ? (
                          <div className="space-y-4">
                            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-xs">
                              <CheckCircle2 className="w-8 h-8 text-[#D35400] mx-auto mb-2" />
                              <p className="text-sm font-bold text-gray-800">
                                Tạo yêu cầu nạp tiền thành công!
                              </p>
                              {topUpResult.gatewayOrderId && (
                                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                  Mã GD: {topUpResult.gatewayOrderId}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                                {formatPts(topUpResult.amountVnd)} VND {" → "}
                                <PtsDisplay
                                  amount={topUpResult.convertedPoints}
                                  className="font-bold text-[#D35400]"
                                />
                              </p>
                            </div>

                            {topUpResult.payUrl && (
                              <div className="flex flex-col items-center gap-3 bg-white border border-gray-50 p-4 rounded-xl shadow-xs">
                                <div className="relative w-44 h-44 overflow-hidden bg-white">
                                  <Image
                                    src={topUpResult.payUrl}
                                    alt="QR Code"
                                    fill
                                    unoptimized
                                    sizes="176px"
                                    className="object-contain"
                                  />
                                </div>
                                <a
                                  href={topUpResult.payUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs font-bold text-[#D35400] hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Mở cổng thanh toán
                                </a>
                              </div>
                            )}

                            {topUpResult.paymentContent && (
                              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                                  Nội dung chuyển khoản chuẩn
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(topUpResult.paymentContent || "");
                                    toast.success("Đã sao chép vào bộ nhớ tạm!");
                                  }}
                                  className="text-xs font-black text-[#D35400] font-mono tracking-wider bg-orange-50/50 hover:bg-orange-100/60 py-2.5 px-3 rounded-lg border border-orange-100 transition-colors w-full break-all select-all flex items-center justify-center gap-2 group"
                                  title="Bấm để sao chép"
                                >
                                  <span>{topUpResult.paymentContent}</span>
                                  <Copy className="w-3.5 h-3.5 shrink-0 text-[#D35400] group-hover:scale-110 transition-transform" />
                                </button>
                              </div>
                            )}

                            <button
                              onClick={handleRetryCheckout}
                              className="w-full py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                            >
                              <RotateCcw className="w-4 h-4" /> Kiểm tra số dư &amp; Đặt hàng
                            </button>
                            <button
                              onClick={() => {
                                setTopUpResult(null);
                                setIsTopUpOpen(false);
                              }}
                              className="w-full py-1.5 text-gray-400 font-bold text-xs hover:text-gray-600 transition-colors text-center"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                  Số tiền (VND)
                                </label>
                                {topUpAmount > 0 && (
                                  <span className="text-xs font-black text-[#D35400] flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                    = {formatPts(Math.floor(topUpAmount / 1000))} pts
                                  </span>
                                )}
                              </div>

                              {neededPoints > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTopUpAmountStr(String(Math.max(10000, neededPoints * 1000)))
                                  }
                                  className="w-full py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-[#D35400] border border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center justify-between"
                                >
                                  <span>⚡ Nạp vừa đủ số điểm thiếu:</span>
                                  <span className="font-extrabold">
                                    {formatPts(neededPoints * 1000)} VND ({neededPoints} pts)
                                  </span>
                                </button>
                              )}

                              <div className="grid grid-cols-3 gap-1.5">
                                {[50000, 100000, 200000].map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setTopUpAmountStr(String(amt))}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                                      topUpAmount === amt
                                        ? "bg-white border-[#D35400] text-[#D35400] shadow-xs"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-orange-200"
                                    }`}
                                  >
                                    {formatPts(amt)}
                                  </button>
                                ))}
                              </div>

                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={topUpAmountStr}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    const clean = raw.replace(/^0+/, "") || "";
                                    setTopUpAmountStr(clean);
                                  }}
                                  placeholder="Nhập số tiền VND..."
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400] transition-all pr-8"
                                />
                                {topUpAmountStr && (
                                  <button
                                    type="button"
                                    onClick={() => setTopUpAmountStr("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {topUpAmount > 0 && topUpAmount < 10000 && (
                                <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  Số tiền nạp tối thiểu là 10.000 VND (tương đương 10 pts)
                                </p>
                              )}
                              {topUpAmount > 10000000 && (
                                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  Số tiền nạp tối đa là 10.000.000 VND
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Phương thức thanh toán
                              </label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {PAYMENT_METHODS.filter((m) => m.id === 4).map((pm) => (
                                  <button
                                    key={pm.id}
                                    onClick={() => setTopUpMethod(pm.id)}
                                    className="p-2.5 rounded-xl text-xs font-bold transition-all border bg-white border-[#D35400] text-[#D35400] text-center w-full shadow-xs"
                                  >
                                    {pm.name}
                                  </button>
                                ))}
                                {COMING_SOON_METHODS.map((name) => (
                                  <button
                                    key={name}
                                    disabled
                                    className="p-2.5 rounded-xl text-xs font-bold border border-dashed border-gray-200 bg-gray-50/70 text-gray-400 cursor-not-allowed relative overflow-hidden flex items-center justify-between w-full"
                                  >
                                    <span>{name}</span>
                                    <span className="bg-amber-100/80 text-amber-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
                                      Sắp ra mắt
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={handleTopUp}
                                disabled={
                                  isTopUpping || topUpAmount < 10000 || topUpAmount > 10000000
                                }
                                className="flex-1 py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10"
                              >
                                {isTopUpping && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isTopUpping ? "Đang xử lý..." : "Lấy mã QR"}
                              </button>
                              <button
                                onClick={() => setIsTopUpOpen(false)}
                                className="py-3 px-4 bg-white text-gray-500 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `,
        }}
      />
    </>
  );
}
