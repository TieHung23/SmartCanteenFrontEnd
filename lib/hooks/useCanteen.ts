"use client";

import { useQuery } from "@tanstack/react-query";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService, type PaginatedList } from "@/services/session.service";
import { orderService } from "@/services/order.service";
import type { OrderListItem, OrderStatus } from "@/types/order.types";

const EMPTY_PAGE = <T>(): PaginatedList<T> => ({
  items: [],
  pageNumber: 1,
  pageSize: 0,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});

const RETRY_DELAY = (attempt: number) => Math.min(1000 * 2 ** attempt, 10000);

export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => sessionService.getSessionDetail(sessionId!),
    enabled: !!sessionId,
    staleTime: 30_000,
    retry: 3,
    retryDelay: RETRY_DELAY,
  });
}

export function useAllDishes() {
  return useQuery({
    queryKey: ["dishes"],
    queryFn: () => dishService.getDishes({ isActive: true, pageSize: 100 }),
    staleTime: 2 * 60 * 1000,
    retry: 3,
    retryDelay: RETRY_DELAY,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: RETRY_DELAY,
  });
}

export function useMyOrders(params?: { pageSize?: number; status?: OrderStatus }) {
  return useQuery({
    queryKey: ["my-orders", params?.pageSize, params?.status],
    queryFn: () => orderService.getMyOrders(params),
    staleTime: 10_000,
    retry: 2,
    retryDelay: RETRY_DELAY,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => orderService.getOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    retry: 2,
    retryDelay: RETRY_DELAY,
  });
}

export function useActiveOrder() {
  return useQuery({
    queryKey: ["active-order"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        orderService.getMyOrders({ status: 2, pageSize: 1 }), // Ready
        orderService.getMyOrders({ status: 1, pageSize: 1 }), // Preparing
        orderService.getMyOrders({ status: 0, pageSize: 1 }), // Pending
      ]);

      const [readyRes, preparingRes, pendingRes] = results;

      const ready = readyRes.status === "fulfilled" ? readyRes.value : EMPTY_PAGE<OrderListItem>();
      const preparing =
        preparingRes.status === "fulfilled" ? preparingRes.value : EMPTY_PAGE<OrderListItem>();
      const pending =
        pendingRes.status === "fulfilled" ? pendingRes.value : EMPTY_PAGE<OrderListItem>();

      if (results.every((r) => r.status === "rejected")) {
        throw (results[0] as PromiseRejectedResult).reason;
      }

      return ready.items?.[0] ?? preparing.items?.[0] ?? pending.items?.[0] ?? null;
    },
    staleTime: 15_000,
    retry: 2,
    retryDelay: RETRY_DELAY,
  });
}
