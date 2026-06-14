"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import Image from "next/image";

interface MealData {
  id: string;
  mainDishId: string;
  name?: string;
  price?: number;
  imgUrl?: string;
  description?: string;
}

interface MealDetailPageProps {
  mealData: MealData;
}

export default function MealDetailPage({ mealData }: MealDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setMealId } = useCart();

  useEffect(() => {
    if (mealData?.id) {
      setMealId(mealData.id);
    }
  }, [mealData, setMealId]);

  const handleAddToCart = () => {
    if (!mealData.mainDishId) return;

    addToCart(
      {
        dishId: mealData.mainDishId,
        name: mealData.name || "Classic Lunch",
        price: mealData.price || 35000,
        imgUrl: mealData.imgUrl,
        description: mealData.description || "Rice, Bruised Shrimp, Soup",
      },
      quantity,
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
      {/* Khung hiển thị khay cơm */}
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-black text-gray-800 tracking-wider mb-6 uppercase">
          Confirm Your Meal
        </h2>
        <div className="relative w-full aspect-square max-w-[380px] bg-white rounded-3xl p-4 shadow-xs border border-gray-100">
          <Image
            src={mealData?.imgUrl || "/placeholder-tray.png"}
            alt="Canteen Tray"
            fill
            sizes="(max-width: 768px) 100vw, 380px" // Cấu hình tối ưu kích thước ảnh cho Next.js
            priority // Ưu tiên hiển thị ảnh chính
            className="object-contain p-2"
          />
        </div>
      </div>

      <div className="flex flex-col justify-between p-2">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#D35400] uppercase tracking-wider">
              Your meal includes:
            </h3>
            <ul className="mt-3 space-y-2 text-sm font-bold text-gray-600">
              <li>1x Rice</li>
              <li>1x Braised Shrimp</li>
              <li>1x Soup</li>
            </ul>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Special note for this item
            </span>
            <input
              type="text"
              placeholder="Xin thêm cơm, ít cay..."
              className="bg-orange-50/60 border border-transparent focus:border-orange-200 outline-none p-3 rounded-xl text-xs font-bold text-gray-700 w-full max-w-xs transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-12 border-t border-gray-100 pt-6">
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1.5 font-black text-gray-500 hover:bg-white rounded-lg transition-colors"
            >
              -
            </button>
            <span className="px-4 text-sm font-black text-gray-700 min-w-[32px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1.5 font-black text-gray-500 hover:bg-white rounded-lg transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 py-3.5 bg-[#D35400] hover:bg-[#B34700] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all text-center"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
