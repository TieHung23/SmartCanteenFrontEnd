"use client";

import React from "react";
import { useCart, CartItem } from "@/context/cart-context";
import { X, Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { toast } from "sonner";

export default function CartDrawer() {
  const router = useRouter();
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    sessionId,
  } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (!sessionId) {
      toast.error("Chưa chọn suất ăn!");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    closeCart();
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col animate-slideInRight">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D35400]/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#D35400]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Giỏ hàng</h3>
                {cartItems.length > 0 && (
                  <p className="text-sm text-gray-400 font-medium">{cartItems.length} món</p>
                )}
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 stroke-1 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-400">Giỏ hàng trống</p>
                <p className="text-sm text-gray-300">Hãy chọn món từ thực đơn</p>
              </div>
            ) : (
              cartItems.map((item: CartItem) => (
                <div
                  key={item.dishId}
                  className="flex gap-5 p-4 rounded-2xl border border-gray-100 bg-white hover:border-orange-100 hover:shadow-sm transition-all"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                    <Image
                      src={item.imgUrl || "/placeholder-user.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 truncate">
                        {item.name}
                      </h4>
                      {item.sessionName && (
                        <p className="text-xs text-orange-500 font-medium mt-0.5">
                          {item.sessionName}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 bg-gray-50 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-[#D35400] transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-bold text-gray-700 min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-[#D35400] transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-base font-bold text-[#D35400]">
                        {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}{" "}
                        <span className="text-xs text-orange-400 font-medium">pts</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.dishId)}
                    className="self-start p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-100 bg-white space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">{cartItems.length} món</p>
                </div>
                <div className="text-2xl font-bold text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(getCartTotal())}{" "}
                  <span className="text-sm text-orange-400 font-medium">pts</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-bold text-base rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Thanh toán ngay
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
