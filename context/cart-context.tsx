"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CreateOrderItem } from "@/types/order.types";
import type { SessionTemplate } from "@/types/session.types";

export interface CartItem extends CreateOrderItem {
  name: string;
  price: number;
  imgUrl?: string;
  description?: string;
  sessionId?: string;
  sessionTemplateId?: string;
  sessionName?: string;
  categoryId?: string;
  categoryName?: string;
  sessionTime?: string;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
}

interface SessionLimitInfo {
  sessionId: string;
  sessionName: string;
  sessionTime: string;
  templateId: string;
  templateName: string;
  categoryLimits: Map<string, { max: number; current: number; categoryName: string }>;
  totalItems: number;
  totalPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, qty: number) => ValidationResult;
  removeFromCart: (dishId: string, sessionId?: string) => void;
  updateQuantity: (dishId: string, quantity: number, sessionId?: string) => ValidationResult;
  clearCart: () => void;
  removeBySessionId: (sessionId: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getSessionLimitInfo: (sessionId: string, mealTemplates: SessionTemplate[]) => SessionLimitInfo | null;
  getCategoryCurrentCount: (sessionId: string, categoryId: string) => number;
  canAddToCategory: (sessionId: string, categoryId: string, mealTemplates: SessionTemplate[], qty: number) => { allowed: boolean; max: number; current: number; categoryName: string };
  getCurrentSessionId: () => string | null;
  hasMultipleSessions: () => boolean;
  uniqueSessionIds: string[];
  selectedSessionIds: string[];
  toggleSessionSelection: (sessionId: string) => void;
  isSessionSelected: (sessionId: string) => boolean;
  selectAllSessions: () => void;
  clearSessionSelection: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function formatTimeRange(t?: string) {
  if (!t) return "";
  const parts = t.split(" - ");
  if (parts.length < 2) return t;
  const fmt = (s: string) => new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(parts[0])} - ${fmt(parts[1])}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("smart_canteen_session");
    return null;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_canteen_cart");
      if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    }
    return [];
  });

  useEffect(() => { localStorage.setItem("smart_canteen_cart", JSON.stringify(cartItems)); }, [cartItems]);

  useEffect(() => {
    sessionId ? localStorage.setItem("smart_canteen_session", sessionId) : localStorage.removeItem("smart_canteen_session");
  }, [sessionId]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const uniqueSessionIds = useMemo(() => {
    return [...new Set(cartItems.map(i => i.sessionId).filter(Boolean) as string[])];
  }, [cartItems]);

  // Selected sessions for checkout — default all selected
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_canteen_selected_sessions");
      if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    }
    return [];
  });

  // Keep selection in sync with cart: auto-select new sessions, remove stale
  useEffect(() => {
    setSelectedSessionIds(prev => {
      const next = prev.filter(sid => uniqueSessionIds.includes(sid));
      for (const sid of uniqueSessionIds) {
        if (!next.includes(sid)) next.push(sid);
      }
      return next;
    });
  }, [uniqueSessionIds]);

  useEffect(() => {
    localStorage.setItem("smart_canteen_selected_sessions", JSON.stringify(selectedSessionIds));
  }, [selectedSessionIds]);

  const toggleSessionSelection = useCallback((sid: string) => {
    setSelectedSessionIds(prev =>
      prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]
    );
  }, []);

  const isSessionSelected = useCallback((sid: string) => selectedSessionIds.includes(sid), [selectedSessionIds]);

  const selectAllSessions = useCallback(() => setSelectedSessionIds([...uniqueSessionIds]), [uniqueSessionIds]);

  const clearSessionSelection = useCallback(() => setSelectedSessionIds([]), []);

  const getCurrentSessionId = useCallback(() => sessionId, [sessionId]);

  const hasMultipleSessions = useCallback(() => uniqueSessionIds.length > 1, [uniqueSessionIds]);

  const getCategoryCurrentCount = useCallback((targetSessionId: string, targetCategoryId: string) => {
    return cartItems.filter(i => i.sessionId === targetSessionId && i.categoryId === targetCategoryId)
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [cartItems]);

  const canAddToCategory = useCallback((targetSessionId: string, targetCategoryId: string, mealTemplates: SessionTemplate[], qty: number) => {
    const firstItem = cartItems.find(i => i.sessionId === targetSessionId);
    const template = mealTemplates.find(t => t.id === firstItem?.sessionTemplateId) || mealTemplates[0];
    if (!template) return { allowed: true, max: 999, current: 0, categoryName: "" };

    const setting = template.settings.find(s => s.categoryId === targetCategoryId);
    if (!setting) return { allowed: true, max: 999, current: 0, categoryName: "" };

    const current = getCategoryCurrentCount(targetSessionId, targetCategoryId);
    return {
      allowed: current + qty <= setting.maxQuantity,
      max: setting.maxQuantity,
      current,
      categoryName: cartItems.find(i => i.categoryId === targetCategoryId)?.categoryName || targetCategoryId,
    };
  }, [cartItems, getCategoryCurrentCount]);

  const getSessionLimitInfo = useCallback((targetSessionId: string, mealTemplates: SessionTemplate[]) => {
    const sessionItems = cartItems.filter(i => i.sessionId === targetSessionId);
    if (sessionItems.length === 0) return null;

    const firstItem = sessionItems[0];
    const template = mealTemplates.find(t => t.id === firstItem.sessionTemplateId) || mealTemplates[0];
    if (!template) return null;

    const categoryLimits = new Map<string, { max: number; current: number; categoryName: string }>();
    template.settings.forEach(s => {
      const current = sessionItems.filter(i => i.categoryId === s.categoryId).reduce((sum, i) => sum + i.quantity, 0);
      categoryLimits.set(s.categoryId, {
        max: s.maxQuantity,
        current,
        categoryName: sessionItems.find(i => i.categoryId === s.categoryId)?.categoryName || s.categoryId,
      });
    });

    return {
      sessionId: targetSessionId,
      sessionName: firstItem.sessionName || "Unknown",
      sessionTime: formatTimeRange(firstItem.sessionTime),
      templateId: template.id,
      templateName: template.name,
      categoryLimits,
      totalItems: sessionItems.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: sessionItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [cartItems]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">, qty: number): ValidationResult => {
    const newSessionId = item.sessionId;

    if (!newSessionId) {
      return { success: false, error: "Thiếu thông tin suất ăn" };
    }

    setCartItems(prev => {
      const existing = prev.find(
        (i) => i.dishId === item.dishId && i.sessionId === newSessionId
      );
      if (existing) {
        return prev.map(
          (i) =>
            i.dishId === item.dishId && i.sessionId === newSessionId
              ? { ...i, quantity: i.quantity + qty }
              : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });

    return { success: true };
  }, [cartItems]);

  const updateQuantity = useCallback((dishId: string, quantity: number, sessionId?: string): ValidationResult => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => !(i.dishId === dishId && (!sessionId || i.sessionId === sessionId))));
      return { success: true };
    }
    setCartItems(prev => prev.map(i =>
      i.dishId === dishId && (!sessionId || i.sessionId === sessionId)
        ? { ...i, quantity }
        : i
    ));
    return { success: true };
  }, []);

  const removeFromCart = useCallback((dishId: string, sessionId?: string) => {
    setCartItems(prev => {
      const next = prev.filter(i => !(i.dishId === dishId && (!sessionId || i.sessionId === sessionId)));
      if (next.length === 0) setSessionId(null);
      return next;
    });
  }, [setSessionId]);

  const removeBySessionId = useCallback((targetSessionId: string) => {
    setCartItems(prev => {
      const next = prev.filter(i => i.sessionId !== targetSessionId);
      if (next.length === 0) setSessionId(null);
      return next;
    });
  }, [setSessionId]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSessionId(null);
  }, [setSessionId]);

  const getCartTotal = useCallback(() => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [cartItems]);
  const getCartCount = useCallback(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems, isCartOpen, sessionId, setSessionId,
      openCart, closeCart, addToCart, removeFromCart, updateQuantity, clearCart,
      removeBySessionId, getCartTotal, getCartCount, getSessionLimitInfo,
      getCategoryCurrentCount, canAddToCategory, getCurrentSessionId,
      hasMultipleSessions, uniqueSessionIds, selectedSessionIds,
      toggleSessionSelection, isSessionSelected, selectAllSessions, clearSessionSelection,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};