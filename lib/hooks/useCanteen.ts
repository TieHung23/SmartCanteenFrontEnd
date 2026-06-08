"use client";

import { useApiData } from "./useApiData";
import { dishService, type PaginatedList } from "@/services/dish.service";
import { categoryService } from "@/services/category.service";
import { orderService } from "@/services/order.service";
import type { Dish } from "@/types/dish.types";
import type { Category } from "@/types/category.types";
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

export function useDishesForMeal(mealId: string | null) {
  return useApiData<PaginatedList<Dish>>(
    () =>
      mealId
        ? dishService.getDishesByMeal(mealId)
        : Promise.resolve({
            isSuccess: false,
            value: EMPTY_PAGE<Dish>(),
            message: "No meal selected",
          }),
    [mealId],
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
  return useApiData<OrderDetail>(
    () =>
      orderId
        ? orderService.getOrderById(orderId)
        : Promise.resolve({
            isSuccess: false,
            value: null as unknown as OrderDetail,
            message: "No order ID",
          }),
    [orderId],
  );
}

export function useActiveOrder() {
  return useApiData<OrderListItem | null>(async () => {
    // Gọi đồng thời các trạng thái đơn hàng mong muốn
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
