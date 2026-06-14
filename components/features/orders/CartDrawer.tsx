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
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, getCartTotal, mealId } =
    useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (!mealId) {
      toast.error("No meal session selected!");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    closeCart();
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF9]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D35400]" />
              <h3 className="text-lg font-extrabold text-gray-800">Smart Canteen Cart</h3>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <ShoppingBag className="w-12 h-12 stroke-1 text-gray-300 animate-pulse" />
                <p className="text-sm font-semibold">Your cart is empty.</p>
              </div>
            ) : (
              cartItems.map((item: CartItem) => (
                <div
                  key={item.dishId}
                  className="flex gap-4 p-3 rounded-2xl border border-gray-50 bg-[#FDFBF9]/50 hover:bg-[#FDFBF9] transition-all"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                    <Image
                      src={item.imgUrl || "/placeholder-user.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 truncate">{item.name}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 bg-white rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-50 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-black text-gray-700 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-50 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-black text-[#D35400]">
                        {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}{" "}
                        <span className="text-[10px] text-orange-400 font-bold">pts</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.dishId)}
                    className="self-start p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-white space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total Amount
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{cartItems.length} unique items</p>
                </div>
                <div className="text-2xl font-black text-[#D35400]">
                  {new Intl.NumberFormat("vi-VN").format(getCartTotal())}{" "}
                  <span className="text-sm text-orange-400 font-bold">pts</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(211,84,0,0.3)] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
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
