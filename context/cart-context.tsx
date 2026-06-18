"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { CreateOrderItem } from "@/types/order.types";

export interface CartItem extends CreateOrderItem {
  name: string;
  price: number;
  imgUrl?: string;
  description?: string;
  mealId?: string;
  mealTemplateId?: string;
  mealName?: string;
  categoryId?: string;
  categoryName?: string;
  mealTime?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  mealId: string | null;
  setMealId: (id: string | null) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mealId, setMealId] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("smart_canteen_cart");
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("smart_canteen_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (item: Omit<CartItem, "quantity">, qty: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.dishId === item.dishId);
      if (existingItem) {
        return prevItems.map((i) =>
          i.dishId === item.dishId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prevItems, { ...item, quantity: qty }];
    });
    if (!isCartOpen) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (dishId: string) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.dishId !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) => (i.dishId === dishId ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setMealId(null);
  };

  const getCartTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getCartCount = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        mealId,
        setMealId,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
