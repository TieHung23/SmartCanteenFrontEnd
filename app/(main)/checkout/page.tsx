"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isAxiosError } from "axios";
import Navbar from "@/components/layout/Navbar";
import { useCart, type CartItem } from "@/context/cart-context";
import { useMealDetail } from "@/lib/hooks/useCanteen";
import { orderService } from "@/services/order.service";
import { paymentService, type TopUpRequest, type TopUpResponse } from "@/services/payment.service";
import { userService, type UserProfileResponse } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import { cartService } from "@/services/cart.service";
import type { CartData } from "@/types/cart.types";
import Link from "next/link";
import { toast } from "sonner";
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
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: 4, name: "Bank Transfer" },
  { id: 5, name: "Smart Canteen Wallet" },
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
  const { cartItems, mealId, getCartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
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

  useEffect(() => {
    if (!orderResult && (!mealId || cartItems.length === 0)) {
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
  }, [mealId, cartItems, router, orderResult]);

  const totalPoints = getCartTotal();
  const balance = profile?.balanceAmount ?? 0;
  const hasEnoughPoints = balance >= totalPoints;
  const neededPoints = Math.max(0, totalPoints - balance);

  const { data: mealDetail } = useMealDetail(mealId);

  const categoryMaxMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!mealDetail?.mealTemplates) return map;
    for (const template of mealDetail.mealTemplates) {
      for (const setting of template.settings) {
        const existing = map.get(setting.categoryId) ?? Infinity;
        map.set(setting.categoryId, Math.min(existing, setting.maxQuantity));
      }
    }
    return map;
  }, [mealDetail]);

  const groupedCartItems = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const catId = item.categoryId || "__unknown__";
      if (!groups.has(catId)) groups.set(catId, []);
      groups.get(catId)!.push(item);
    }
    return groups;
  }, [cartItems]);

  const mealInfo = useMemo(() => {
    const first = cartItems[0];
    if (!first) return null;
    return { name: first.mealName, time: first.mealTime };
  }, [cartItems]);

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
    if (!mealId) return;
    setIsSubmitting(true);
    try {
      let currentVersion = 0;
      try {
        const serverCart = await cartService.getCart();
        currentVersion = serverCart.version;
      } catch {}

      const mealTemplateId =
        mealDetail?.mealTemplates?.[0]?.id || "00000000-0000-0000-0000-000000000000";

      const cartData: CartData = {
        mealId,
        mealTemplateId,
        items: cartItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
        })),
      };
      const updatedCart = await cartService.updateCart(cartData, currentVersion);

      const result = await orderService.createOrder(updatedCart.version);
      clearCart();
      setOrderResult(result);
      toast.success(result.message || "Order placed successfully!");
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
  }, [mealId, cartItems, mealDetail, clearCart]);

  const handleTopUp = useCallback(async () => {
    if (topUpAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsTopUpping(true);
    try {
      const data: TopUpRequest = { amountVnd: topUpAmount, method: topUpMethod };
      const result = await paymentService.topUpWallet(data);
      setTopUpResult(result);
      toast.success("Top-up request created!");
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
            ? `Insufficient balance. You have ${res.balanceAmount} pts, need ${totalPoints} pts.`
            : "Unable to check balance. Please try again.",
        );
      }
    } catch {
      toast.error("Unable to check balance. Please try again.");
    }
  };

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
              <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Order Confirmed!</h1>
              <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">{orderResult.message}</p>

              <div className="bg-gradient-to-br from-orange-50 to-orange-50/30 rounded-2xl p-6 space-y-4 text-left mb-8 border border-orange-100/40">
                <div className="flex items-center gap-3 pb-3 border-b border-orange-100/30">
                  <div className="w-8 h-8 bg-[#D35400]/10 rounded-lg flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-[#D35400]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Order Receipt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                    {orderResult.id.slice(0, 12)}...
                  </span>
                </div>
                {orderResult.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                      {orderResult.transactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#D35400]" /> Wallet Points
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-orange-100/30">
                  <span className="text-base font-bold text-gray-800">Total Paid</span>
                  <PtsDisplay
                    amount={orderResult.totalPrice}
                    className="text-lg font-black text-[#D35400]"
                  />
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Remaining Balance</span>
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
                  View My Orders
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    router.push(ROUTES.SESSION);
                  }}
                  className="flex-1 py-3.5 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all active:scale-[0.98]"
                >
                  Browse Sessions
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
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-orange-100/30 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                <ShoppingBag className="w-5 h-5 text-[#D35400]" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-800">Checkout</h1>
                {mealInfo?.name && (
                  <p
                    suppressHydrationWarning
                    className="text-xs font-bold text-orange-500 mt-0.5 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {mealInfo.name} (
                    {formatTimeRange(mealInfo.time)})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {Array.from(groupedCartItems.entries()).map(([catId, items]) => {
                const catMax = catId !== "__unknown__" ? categoryMaxMap.get(catId) : undefined;
                return (
                  <div key={catId} className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                        {items[0]?.categoryName || "Other"}
                      </span>
                      {catMax !== undefined && (
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-md">
                          Selected: {items.reduce((s, i) => s + i.quantity, 0)}/{catMax}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const catItemCount = items.reduce((s, i) => s + i.quantity, 0);
                        const isAtMax = catMax !== undefined && catItemCount >= catMax;
                        return (
                          <div
                            key={item.dishId}
                            className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-50 shadow-xs hover:border-orange-100 transition-all group"
                          >
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              <Image
                                src={item.imgUrl || "/placeholder-food.png"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-800 truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <PtsDisplay amount={item.price} /> each
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg">
                                  <button
                                    onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                                    className="p-1.5 rounded-md text-gray-500 hover:bg-white transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-3 text-xs font-black text-gray-700 min-w-[24px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (isAtMax) {
                                        toast.error(`Maximum quantity of ${catMax} items reached.`);
                                        return;
                                      }
                                      updateQuantity(item.dishId, item.quantity + 1);
                                    }}
                                    className={`p-1.5 rounded-md text-gray-500 hover:bg-white transition-colors ${
                                      isAtMax ? "opacity-30 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-sm font-black text-[#D35400]">
                                  <PtsDisplay amount={item.price * item.quantity} />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.dishId)}
                              className="self-start p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
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

            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#D35400]" />
                  </div>
                  <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                    Payment Summary
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Items ({cartItems.length})</span>
                    <PtsDisplay amount={totalPoints} className="font-bold text-gray-800" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Your Balance</span>
                    <PtsDisplay amount={balance} className="font-bold text-[#D35400]" />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">Payment Method</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-orange-50/60 px-3 py-1.5 rounded-xl border border-orange-100/40">
                        <Wallet className="w-3.5 h-3.5 text-[#D35400]" /> Digital Wallet
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-gray-800">Total Price</span>
                      <PtsDisplay
                        amount={totalPoints}
                        className="font-black text-[#D35400] text-xl"
                      />
                    </div>
                  </div>
                </div>
                {!profile?.emailVerified ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-800">
                          Tài khoản chưa được xác thực
                        </p>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">
                          Bạn cần xác thực email và hoàn tất định danh tài khoản trước khi có thể
                          đặt hàng.
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
                      <Link
                        href={ROUTES.VERIFICATION}
                        className="flex-1 py-3.5 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl text-center transition-all shadow-md"
                      >
                        Định danh ngay
                      </Link>
                    </div>
                  </div>
                ) : hasEnoughPoints ? (
                  <button
                    onClick={handleCreateOrder}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" /> Pay{" "}
                        <PtsDisplay amount={totalPoints} className="text-white" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#D35400] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-[#B34700]">Insufficient Balance</p>
                        <p className="text-xs text-orange-500 mt-1">
                          You need <strong>{formatPts(neededPoints)}</strong> more points. Please
                          top up.
                        </p>
                      </div>
                    </div>

                    {!isTopUpOpen ? (
                      <button
                        onClick={() => {
                          setTopUpAmount(Math.max(50000, neededPoints * 1000));
                          setIsTopUpOpen(true);
                        }}
                        className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Top Up &amp; Pay
                      </button>
                    ) : (
                      <div className="space-y-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 animate-fadeIn">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                          Top Up Your Wallet
                        </h3>

                        {topUpResult ? (
                          <div className="space-y-4">
                            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-xs">
                              <CheckCircle2 className="w-8 h-8 text-[#D35400] mx-auto mb-2" />
                              <p className="text-sm font-bold text-gray-800">
                                Top-up request created!
                              </p>
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
                                  <ExternalLink className="w-3.5 h-3.5" /> Open payment gateway
                                </a>
                              </div>
                            )}

                            {topUpResult.paymentContent && (
                              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                  Nội dung chuyển khoản chuẩn
                                </p>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(topUpResult.paymentContent || "");
                                    toast.success("Copied to clipboard!");
                                  }}
                                  className="text-xs font-black text-[#D35400] tracking-wider bg-gray-50 py-2 px-3 rounded-lg border border-gray-100 hover:bg-orange-50 transition-colors w-full truncate"
                                >
                                  {topUpResult.paymentContent}
                                </button>
                              </div>
                            )}

                            <button
                              onClick={handleRetryCheckout}
                              className="w-full py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                            >
                              <RotateCcw className="w-4 h-4" /> Check Balance &amp; Place Order
                            </button>
                            <button
                              onClick={() => {
                                setTopUpResult(null);
                                setIsTopUpOpen(false);
                              }}
                              className="w-full py-1.5 text-gray-400 font-bold text-xs hover:text-gray-600 transition-colors text-center"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Amount (VND)
                              </label>
                              <div className="grid grid-cols-3 gap-1.5">
                                {[50000, 100000, 200000].map((amt) => (
                                  <button
                                    key={amt}
                                    onClick={() => setTopUpAmount(amt)}
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
                              <input
                                type="number"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(Number(e.target.value) || 0)}
                                min={10000}
                                step={10000}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400]"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Payment Method
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
                                    className="p-2.5 rounded-xl text-xs font-bold border border-dashed border-gray-200 bg-gray-50/50 text-gray-300 cursor-not-allowed relative overflow-hidden text-center w-full"
                                  >
                                    {name}
                                    <span className="absolute -top-1 -right-3 bg-gray-200 text-gray-400 text-[6px] font-black uppercase px-2 py-0.5 -rotate-[16deg]">
                                      Soon
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={handleTopUp}
                                disabled={isTopUpping || topUpAmount < 10000}
                                className="flex-1 py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10"
                              >
                                {isTopUpping && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isTopUpping ? "Processing..." : "Get QR Code"}
                              </button>
                              <button
                                onClick={() => setIsTopUpOpen(false)}
                                className="py-3 px-4 bg-white text-gray-500 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
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
