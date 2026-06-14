"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/context/cart-context";
import { orderService } from "@/services/order.service";
import { paymentService, type TopUpRequest, type TopUpResponse } from "@/services/payment.service";
import { userService, type UserProfileResponse } from "@/services/user.service";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShoppingBag,
  Wallet,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: 1, name: "MoMo" },
  { id: 2, name: "ZaloPay" },
  { id: 3, name: "VNPay" },
  { id: 4, name: "SePay (Bank Transfer)" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, mealId, getCartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpMethod, setTopUpMethod] = useState(1);
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
    if (!mealId || cartItems.length === 0) {
      router.push(ROUTES.MENU);
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
  }, [mealId, cartItems, router]);

  const totalPoints = getCartTotal();
  const balance = profile?.balanceAmount ?? 0;
  const hasEnoughPoints = balance >= totalPoints;
  const neededPoints = Math.max(0, totalPoints - balance);

  const handleCreateOrder = useCallback(async () => {
    if (!mealId) return;
    setIsSubmitting(true);
    try {
      const cleanedItems = cartItems.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
      }));
      const result = await orderService.createOrder(mealId, cleanedItems);
      setOrderResult(result);
      toast.success(result.message || "Order placed successfully!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || "Order failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [mealId, cartItems]);

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
      if (result.payUrl) {
        window.open(result.payUrl, "_blank");
      }
      toast.success("Top-up request created! Complete payment to proceed.");
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

  if (orderResult) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#FDFBF9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-100/40 to-transparent pointer-events-none" />
          <div className="max-w-md w-full bg-white rounded-[2rem] shadow-lg border border-orange-100/50 p-10 text-center relative z-10">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-100">
              <CheckCircle2 className="w-12 h-12 text-[#D35400]" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Order Placed!</h1>
            <p className="text-gray-400 text-sm mb-6">{orderResult.message}</p>
            <div className="bg-orange-50/60 rounded-2xl p-6 space-y-3 text-left mb-8 border border-orange-100/30">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-bold text-gray-800 truncate ml-4 max-w-[200px]">
                  {orderResult.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-bold text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(orderResult.totalPrice)} pts
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-orange-100/50 pt-3">
                <span className="text-gray-500">Remaining Balance</span>
                <span className="font-bold text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(orderResult.userRemainingBalance)} pts
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  clearCart();
                  router.push(ROUTES.ORDERS);
                }}
                className="flex-1 py-3.5 bg-[#D35400] text-white font-bold text-sm rounded-xl hover:bg-[#B34700] transition-all shadow-[0_4px_12px_rgba(211,84,0,0.25)]"
              >
                View My Orders
              </button>
              <button
                onClick={() => {
                  clearCart();
                  router.push(ROUTES.SESSION);
                }}
                className="flex-1 py-3.5 bg-white text-gray-700 font-bold text-sm rounded-xl border-2 border-gray-200 hover:border-[#D35400] hover:text-[#D35400] transition-all"
              >
                Browse Sessions
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFBF9] py-8 px-4 sm:px-6 font-sans">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-orange-100/30 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#D35400] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <ShoppingBag className="w-5 h-5 text-[#D35400]" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT - Cart Summary */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                Order Summary
              </h2>
              {cartItems.map((item) => (
                <div
                  key={item.dishId}
                  className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-50 shadow-sm hover:border-orange-100 transition-all group"
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
                    <h4 className="text-sm font-bold text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Intl.NumberFormat("vi-VN").format(item.price)} pts each
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-black text-gray-700 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm font-black text-[#D35400]">
                        {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)} pts
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
              ))}
            </div>

            {/* RIGHT - Payment Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100/40 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#D35400]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-700">Payment Summary</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items ({cartItems.length})</span>
                    <span className="font-bold text-gray-800">
                      {new Intl.NumberFormat("vi-VN").format(totalPoints)} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your Balance</span>
                    <span className="font-bold text-[#D35400]">
                      {new Intl.NumberFormat("vi-VN").format(balance)} pts
                    </span>
                  </div>
                  <div className="border-t border-orange-100/30 pt-4 flex justify-between text-base">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-black text-[#D35400] text-lg">
                      {new Intl.NumberFormat("vi-VN").format(totalPoints)} pts
                    </span>
                  </div>
                </div>

                {hasEnoughPoints ? (
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
                        {new Intl.NumberFormat("vi-VN").format(totalPoints)} pts
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
                          You need{" "}
                          <strong>{new Intl.NumberFormat("vi-VN").format(neededPoints)}</strong>{" "}
                          more points. Top up to continue.
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
                        <ArrowUpRight className="w-4 h-4" /> Top Up & Pay
                      </button>
                    ) : (
                      <div className="space-y-4 bg-orange-50/70 rounded-2xl p-5 border border-orange-100">
                        <h3 className="text-sm font-bold text-gray-700">Top Up Your Wallet</h3>

                        {topUpResult ? (
                          <div className="space-y-3">
                            <div className="bg-white border border-orange-100 rounded-xl p-4 text-center">
                              <CheckCircle2 className="w-8 h-8 text-[#D35400] mx-auto mb-2" />
                              <p className="text-sm font-bold text-gray-800">
                                Top-up request created!
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Intl.NumberFormat("vi-VN").format(topUpResult.amountVnd)} VND
                                {" → "}
                                {new Intl.NumberFormat("vi-VN").format(
                                  topUpResult.convertedPoints,
                                )}{" "}
                                pts
                              </p>
                              <span className="inline-block mt-2 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                                {topUpResult.status}
                              </span>
                            </div>
                            {topUpResult.payUrl && (
                              <a
                                href={topUpResult.payUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl transition-all"
                              >
                                <ExternalLink className="w-4 h-4" /> Open Payment Gateway
                              </a>
                            )}
                            <button
                              onClick={handleRetryCheckout}
                              className="w-full py-3 bg-white text-[#D35400] font-bold text-sm rounded-xl border-2 border-[#D35400] hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" /> I&apos;ve Paid - Check & Order
                            </button>
                            <button
                              onClick={() => {
                                setTopUpResult(null);
                                setIsTopUpOpen(false);
                              }}
                              className="w-full py-2 text-gray-400 font-bold text-xs hover:text-gray-600 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                                Amount (VND)
                              </label>
                              <div className="grid grid-cols-3 gap-1.5 mb-2">
                                {[50000, 100000, 200000].map((amt) => (
                                  <button
                                    key={amt}
                                    onClick={() => setTopUpAmount(amt)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                      topUpAmount === amt
                                        ? "bg-white border-[#D35400] text-[#D35400]"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-orange-200"
                                    }`}
                                  >
                                    {new Intl.NumberFormat("vi-VN").format(amt)}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="number"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(Number(e.target.value) || 0)}
                                min={10000}
                                step={10000}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#D35400] focus:ring-1 focus:ring-orange-200"
                              />
                              <p className="text-[10px] text-gray-400 mt-1">
                                ~
                                {new Intl.NumberFormat("vi-VN").format(
                                  Math.floor(topUpAmount / 1000),
                                )}{" "}
                                pts
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                                Payment Method
                              </label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {PAYMENT_METHODS.map((pm) => (
                                  <button
                                    key={pm.id}
                                    onClick={() => setTopUpMethod(pm.id)}
                                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                      topUpMethod === pm.id
                                        ? "bg-white border-[#D35400] text-[#D35400]"
                                        : "bg-white border-gray-200 text-gray-500 hover:border-orange-200"
                                    }`}
                                  >
                                    {pm.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={handleTopUp}
                                disabled={isTopUpping || topUpAmount < 10000}
                                className="flex-1 py-3 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                              >
                                {isTopUpping ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                                {isTopUpping ? "Processing..." : "Top Up"}
                              </button>
                              <button
                                onClick={() => setIsTopUpOpen(false)}
                                className="py-3 px-4 bg-white text-gray-500 font-bold text-sm rounded-xl border border-gray-200 hover:border-orange-200 transition-all"
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
    </>
  );
}
