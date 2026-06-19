"use client";

import { useApiData } from "./useApiData";
import { dishService } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { sessionService, type PaginatedList } from "@/services/session.service";
import { orderService } from "@/services/order.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
import type { SessionDetail } from "@/types/session.types";
import type { OrderDetail, OrderListItem, OrderStatus } from "@/types/order.types";

const EMPTY_PAGE = <T>(): PaginatedList<T> => ({
  items: [],
  pageNumber: 1,
  pageSize: 0,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});

export function useSessionDetail(sessionId: string | null) {
  return useApiData<SessionDetail | null>(
    () => (sessionId ? sessionService.getSessionDetail(sessionId) : Promise.resolve(null)),
    [sessionId],
  );
}

export function useAllDishes() {
  return useApiData<PaginatedList<Dish>>(
    () => dishService.getDishes({ isActive: true, pageSize: 100 }),
    [],
  );
}

export function useCategories() {
  return useApiData<PaginatedList<Category>>(() => categoryService.getAll(), []);
}

export function useMyOrders(params?: { pageSize?: number; status?: OrderStatus }) {
  return useApiData<PaginatedList<OrderListItem>>(
    () => orderService.getMyOrders(params),
    [params?.pageSize, params?.status],
  );
}

export function useOrderDetail(orderId: string | null) {
  return useApiData<OrderDetail | null>(
    () => (orderId ? orderService.getOrderById(orderId) : Promise.resolve(null)),
    [orderId],
  );
}

export function useActiveOrder() {
  return useApiData<OrderListItem | null>(async () => {
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
  }, []);
}
