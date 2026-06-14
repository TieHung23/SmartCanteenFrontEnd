import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreateOrderItem,
  CreateOrderResponse,
  OrderDetail,
  OrderListItem,
  OrderStatus,
} from "@/types/order.types";
import type { PaginatedList } from "./meal.service";

export const orderService = {
  getMyOrders: async (params?: {
    pageSize?: number;
    pageNumber?: number;
    status?: OrderStatus;
  }): Promise<PaginatedList<OrderListItem>> => {
    return await apiClient.get<PaginatedList<OrderListItem>, PaginatedList<OrderListItem>>(
      API_ENDPOINTS.ORDER.LIST,
      { params },
    );
  },

  getOrderById: async (id: string): Promise<OrderDetail> => {
    return await apiClient.get<OrderDetail, OrderDetail>(API_ENDPOINTS.ORDER.GET(id));
  },

  createOrder: async (mealId: string, items: CreateOrderItem[]): Promise<CreateOrderResponse> => {
    return await apiClient.post<CreateOrderResponse, CreateOrderResponse>(
      API_ENDPOINTS.ORDER.CREATE,
      { mealId, items },
    );
  },

  confirmReceived: async (orderId: string) => {
    return await apiClient.put<
      { id: string; status: number; message: string },
      { id: string; status: number; message: string }
    >(API_ENDPOINTS.ORDER.UPDATE(orderId), { id: orderId, status: 2 });
  },
};
