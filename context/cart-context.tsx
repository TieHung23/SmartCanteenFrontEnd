"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { isAxiosError } from "axios";
import type { CreateOrderItem } from "@/types/order.types";
import type { SessionTemplate } from "@/types/session.types";
import type { CartSessionData } from "@/types/cart.types";
import { cartService } from "@/services/cart.service";
import { useAuth } from "@/context/auth-context";

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
  getSessionLimitInfo: (
    sessionId: string,
    mealTemplates: SessionTemplate[],
  ) => SessionLimitInfo | null;
  getCategoryCurrentCount: (sessionId: string, categoryId: string) => number;
  canAddToCategory: (
    sessionId: string,
    categoryId: string,
    mealTemplates: SessionTemplate[],
    qty: number,
  ) => { allowed: boolean; max: number; current: number; categoryName: string };
  getCurrentSessionId: () => string | null;
  hasMultipleSessions: () => boolean;
  uniqueSessionIds: string[];
  selectedSessionIds: string[];
  toggleSessionSelection: (sessionId: string) => void;
  isSessionSelected: (sessionId: string) => boolean;
  selectAllSessions: () => void;
  clearSessionSelection: () => void;
  cartVersion: number;
  isSyncing: boolean;
  isCartLoaded: boolean;
  ensureSynced: () => Promise<number | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function formatTimeRange(t?: string) {
  if (!t) return "";
  const parts = t.split(" - ");
  if (parts.length < 2) return t;
  const fmt = (s: string) =>
    new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(parts[0])} - ${fmt(parts[1])}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isCustomerRoute = pathname
    ? !pathname.startsWith("/manager") && !pathname.startsWith("/staff")
    : true;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("smart_canteen_session");
    return null;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_canteen_cart");
      if (saved) {
        try {
          return JSON.parse(saved);
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

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("smart_canteen_session", sessionId);
    } else {
      localStorage.removeItem("smart_canteen_session");
    }
  }, [sessionId]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const [cartVersion, setCartVersion] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_canteen_cart_version");
      if (saved) {
        try {
          return Number(saved);
        } catch {}
      }
    }
    return 0;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem("smart_canteen_cart_version", String(cartVersion));
  }, [cartVersion]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cartItemsRef = useRef(cartItems);
  const cartVersionRef = useRef(cartVersion);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);
  useEffect(() => {
    cartVersionRef.current = cartVersion;
  }, [cartVersion]);

  const uniqueSessionIds = useMemo(() => {
    return [...new Set(cartItems.map((i) => i.sessionId).filter(Boolean) as string[])];
  }, [cartItems]);

  function buildSessions(items: CartItem[]): CartSessionData[] {
    const map = new Map<string, CartSessionData>();
    for (const item of items) {
      if (!item.sessionId) continue;
      if (!map.has(item.sessionId)) {
        const mealTemplateId =
          items.find((i) => i.sessionId === item.sessionId && i.sessionTemplateId)
            ?.sessionTemplateId || "";
        map.set(item.sessionId, {
          sessionId: item.sessionId,
          mealTemplateId,
          items: [],
        });
      }
      map.get(item.sessionId)!.items.push({ dishId: item.dishId, quantity: item.quantity });
    }
    return Array.from(map.values());
  }

  // Mount: fetch server cart, merge with local items
  useEffect(() => {
    if (!isAuthenticated || !isCustomerRoute) {
      Promise.resolve().then(() => setIsCartLoaded(true));
      return;
    }
    cartService
      .getCart()
      .then((serverCart) => {
        setCartVersion(serverCart.version);
        if (serverCart.data?.sessions?.length) {
          setCartItems((prev) => {
            const merged = [...prev];
            for (const s of serverCart.data.sessions) {
              for (const item of s.items) {
                const exists = prev.some(
                  (ci) => ci.dishId === item.dishId && ci.sessionId === s.sessionId,
                );
                if (!exists) {
                  merged.push({
                    dishId: item.dishId,
                    quantity: item.quantity,
                    name: `Dish ${item.dishId.slice(0, 8)}`,
                    price: 0,
                    sessionId: s.sessionId,
                    sessionTemplateId: s.mealTemplateId,
                  });
                }
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsCartLoaded(true));
  }, [isAuthenticated, isCustomerRoute]);

  const pushToServer = useCallback(async (): Promise<number | null> => {
    if (!isAuthenticated || !isCustomerRoute) return null;

    const items = cartItemsRef.current;
    const version = cartVersionRef.current;

    setIsSyncing(true);
    try {
      if (items.length === 0) {
        await cartService.deleteCart(version).catch(() => {});
        return version;
      }
      const sessions = buildSessions(items);
      const result = await cartService.updateCart({ sessions }, version);
      cartVersionRef.current = result.version;
      setCartVersion(result.version);
      return result.version;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        try {
          const serverCart = await cartService.getCart();
          cartVersionRef.current = serverCart.version;
          setCartVersion(serverCart.version);
          const items2 = cartItemsRef.current;
          const sessions = buildSessions(items2);
          const result = await cartService.updateCart({ sessions }, serverCart.version);
          cartVersionRef.current = result.version;
          setCartVersion(result.version);
          return result.version;
        } catch {
          return null;
        }
      }
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isCustomerRoute]);

  const pushToServerRef = useRef(pushToServer);
  useEffect(() => {
    pushToServerRef.current = pushToServer;
  }, [pushToServer]);

  // Debounced sync on cart changes (only after initial server load)
  useEffect(() => {
    if (!isCartLoaded || !isAuthenticated || !isCustomerRoute) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => pushToServerRef.current(), 500);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [cartItems, isCartLoaded, isAuthenticated, isCustomerRoute]);

  const ensureSynced = useCallback(async (): Promise<number | null> => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = undefined;
    }
    return await pushToServerRef.current();
  }, []);

  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_canteen_selected_sessions");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedSessionIds((prev) => {
        const next = prev.filter((sid) => uniqueSessionIds.includes(sid));
        for (const sid of uniqueSessionIds) {
          if (!next.includes(sid)) next.push(sid);
        }
        return next;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [uniqueSessionIds]);

  useEffect(() => {
    localStorage.setItem("smart_canteen_selected_sessions", JSON.stringify(selectedSessionIds));
  }, [selectedSessionIds]);

  const toggleSessionSelection = useCallback((sid: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid],
    );
  }, []);

  const isSessionSelected = useCallback(
    (sid: string) => selectedSessionIds.includes(sid),
    [selectedSessionIds],
  );

  const selectAllSessions = useCallback(
    () => setSelectedSessionIds([...uniqueSessionIds]),
    [uniqueSessionIds],
  );

  const clearSessionSelection = useCallback(() => setSelectedSessionIds([]), []);

  const getCurrentSessionId = useCallback(() => sessionId, [sessionId]);

  const hasMultipleSessions = useCallback(() => uniqueSessionIds.length > 1, [uniqueSessionIds]);

  const getCategoryCurrentCount = useCallback(
    (targetSessionId: string, targetCategoryId: string) => {
      return cartItems
        .filter((i) => i.sessionId === targetSessionId && i.categoryId === targetCategoryId)
        .reduce((sum, i) => sum + i.quantity, 0);
    },
    [cartItems],
  );

  const canAddToCategory = useCallback(
    (
      targetSessionId: string,
      targetCategoryId: string,
      mealTemplates: SessionTemplate[],
      qty: number,
    ) => {
      const firstItem = cartItems.find((i) => i.sessionId === targetSessionId);
      const template =
        mealTemplates.find((t) => t.id === firstItem?.sessionTemplateId) || mealTemplates[0];
      if (!template) return { allowed: true, max: 999, current: 0, categoryName: "" };

      const setting = template.settings.find((s) => s.categoryId === targetCategoryId);
      if (!setting) return { allowed: true, max: 999, current: 0, categoryName: "" };

      const current = getCategoryCurrentCount(targetSessionId, targetCategoryId);
      return {
        allowed: current + qty <= setting.maxQuantity,
        max: setting.maxQuantity,
        current,
        categoryName:
          cartItems.find((i) => i.categoryId === targetCategoryId)?.categoryName ||
          targetCategoryId,
      };
    },
    [cartItems, getCategoryCurrentCount],
  );

  const getSessionLimitInfo = useCallback(
    (targetSessionId: string, mealTemplates: SessionTemplate[]) => {
      const sessionItems = cartItems.filter((i) => i.sessionId !== targetSessionId);
      if (sessionItems.length === 0) return null;

      const firstItem = sessionItems[0];
      const template =
        mealTemplates.find((t) => t.id === firstItem.sessionTemplateId) || mealTemplates[0];
      if (!template) return null;

      const categoryLimits = new Map<
        string,
        { max: number; current: number; categoryName: string }
      >();
      template.settings.forEach((s) => {
        const current = sessionItems
          .filter((i) => i.categoryId === s.categoryId)
          .reduce((sum, i) => sum + i.quantity, 0);
        categoryLimits.set(s.categoryId, {
          max: s.maxQuantity,
          current,
          categoryName:
            sessionItems.find((i) => i.categoryId === s.categoryId)?.categoryName || s.categoryId,
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
    },
    [cartItems],
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, qty: number): ValidationResult => {
      const newSessionId = item.sessionId;

      if (!newSessionId) {
        return { success: false, error: "Thiếu thông tin suất ăn" };
      }

      setCartItems((prev) => {
        const existing = prev.find((i) => i.dishId === item.dishId && i.sessionId === newSessionId);
        if (existing) {
          return prev.map((i) =>
            i.dishId === item.dishId && i.sessionId === newSessionId
              ? { ...i, quantity: i.quantity + qty }
              : i,
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });

      return { success: true };
    },
    [],
  );

  const updateQuantity = useCallback(
    (dishId: string, quantity: number, sessionId?: string): ValidationResult => {
      if (quantity <= 0) {
        setCartItems((prev) =>
          prev.filter((i) => !(i.dishId === dishId && (!sessionId || i.sessionId === sessionId))),
        );
        return { success: true };
      }
      setCartItems((prev) =>
        prev.map((i) =>
          i.dishId === dishId && (!sessionId || i.sessionId === sessionId) ? { ...i, quantity } : i,
        ),
      );
      return { success: true };
    },
    [],
  );

  const removeFromCart = useCallback(
    (dishId: string, sessionId?: string) => {
      setCartItems((prev) => {
        const next = prev.filter(
          (i) => !(i.dishId === dishId && (!sessionId || i.sessionId === sessionId)),
        );
        if (next.length === 0) setSessionId(null);
        return next;
      });
    },
    [setSessionId],
  );

  const removeBySessionId = useCallback(
    (targetSessionId: string) => {
      setCartItems((prev) => {
        const next = prev.filter((i) => i.sessionId !== targetSessionId);
        if (next.length === 0) setSessionId(null);
        return next;
      });
    },
    [setSessionId],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setSessionId(null);
  }, [setSessionId]);

  const getCartTotal = useCallback(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems],
  );
  const getCartCount = useCallback(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems],
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartVersion,
        isSyncing,
        isCartLoaded,
        ensureSynced,
        isCartOpen,
        sessionId,
        setSessionId,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        removeBySessionId,
        getCartTotal,
        getCartCount,
        getSessionLimitInfo,
        getCategoryCurrentCount,
        canAddToCategory,
        getCurrentSessionId,
        hasMultipleSessions,
        uniqueSessionIds,
        selectedSessionIds,
        toggleSessionSelection,
        isSessionSelected,
        selectAllSessions,
        clearSessionSelection,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
