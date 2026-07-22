import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreateOrderResponse,
  OrderDetail,
  OrderListItem,
  OrderStatus,
} from "@/types/order.types";
import type { ApiResponse, PaginatedList } from "./session.service";

export const orderService = {
  getMyOrders: async (params?: {
    pageSize?: number;
    pageNumber?: number;
    status?: OrderStatus;
  }): Promise<PaginatedList<OrderListItem>> => {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.pageSize) queryParams.PageSize = params.pageSize;
      if (params.pageNumber) queryParams.PageNumber = params.pageNumber;
      if (params.status !== undefined) queryParams.Status = params.status;
    }
    const response = (await apiClient.get<ApiResponse<PaginatedList<OrderListItem>>>(
      API_ENDPOINTS.ORDER.LIST,
      { params: queryParams },
    )) as unknown as ApiResponse<PaginatedList<OrderListItem>>;

    return response.value;
  },

  getAll: async (params?: {
    pageSize?: number;
    pageNumber?: number;
    status?: OrderStatus;
  }): Promise<PaginatedList<OrderListItem>> => {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.pageSize) queryParams.PageSize = params.pageSize;
      if (params.pageNumber) queryParams.PageNumber = params.pageNumber;
      if (params.status !== undefined) queryParams.Status = params.status;
    }
    const response = (await apiClient.get<ApiResponse<PaginatedList<OrderListItem>>>(
      API_ENDPOINTS.ORDER.LIST,
      { params: queryParams },
    )) as unknown as ApiResponse<PaginatedList<OrderListItem>>;
    return response.value;
  },
  getOrderById: async (id: string): Promise<OrderDetail> => {
    const response = (await apiClient.get<ApiResponse<OrderDetail>>(
      API_ENDPOINTS.ORDER.GET(id),
    )) as unknown as ApiResponse<OrderDetail>;
    return response.value;
  },

  createOrder: async (sessionId: string, cartVersion: number): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<ApiResponse<CreateOrderResponse>>(
      API_ENDPOINTS.ORDER.CREATE,
      { sessionId, cartVersion },
    );
    return (response as unknown as ApiResponse<CreateOrderResponse>).value;
  },

  confirmReceived: async (orderId: string) => {
    const response = (await apiClient.put<
      ApiResponse<{ id: string; status: number; message: string }>
    >(
      API_ENDPOINTS.ORDER.UPDATE(orderId),
      { id: orderId, status: 2 }, // 2 = Completed
    )) as unknown as ApiResponse<{ id: string; status: number; message: string }>;

    return response.value;
  },

  updateOrderStatus: async (orderId: string, status: number, note?: string) => {
    const response = (await apiClient.put<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.ORDER.UPDATE(orderId),
      { id: orderId, status, ...(note && { note }) },
    )) as unknown as ApiResponse<{ message: string }>;
    return response.value;
  },

  getManagerOrdersBySession: async (
    sessionId: string,
    params?: {
      pageSize?: number;
      pageNumber?: number;
      status?: OrderStatus;
    },
  ): Promise<PaginatedList<OrderListItem>> => {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.pageSize) queryParams.PageSize = params.pageSize;
      if (params.pageNumber) queryParams.PageNumber = params.pageNumber;
      if (params.status !== undefined) queryParams.Status = params.status;
    }
    const response = (await apiClient.get<ApiResponse<PaginatedList<OrderListItem>>>(
      API_ENDPOINTS.ORDER.MANAGER_BY_SESSION(sessionId),
      { params: queryParams },
    )) as unknown as ApiResponse<PaginatedList<OrderListItem>>;
    return response.value;
  },
};
