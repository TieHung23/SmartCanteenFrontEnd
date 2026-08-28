import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CreateOrderResponse,
  GetOrdersParams,
  OrderDetail,
  OrderListItem,
} from "@/types/order.types";
import type { ServingJobEvent } from "@/types/serving-job.types";
import type { ApiResponse, PaginatedList } from "./session.service";

function buildOrderQueryParams(
  params?: GetOrdersParams,
): Record<string, string | number | undefined> {
  const queryParams: Record<string, string | number | undefined> = {};
  if (!params) return queryParams;

  if (params.pageSize) {
    queryParams.pageSize = params.pageSize;
    queryParams.PageSize = params.pageSize;
  }
  if (params.pageNumber) {
    queryParams.pageNumber = params.pageNumber;
    queryParams.PageNumber = params.pageNumber;
  }
  if (params.status !== undefined) {
    queryParams.status = params.status;
    queryParams.Status = params.status;
  }
  if (params.sessionId) {
    queryParams.sessionId = params.sessionId;
    queryParams.SessionId = params.sessionId;
  }
  if (params.createdFrom) {
    queryParams.createdFrom = params.createdFrom;
    queryParams.CreatedFrom = params.createdFrom;
  }
  if (params.createdTo) {
    queryParams.createdTo = params.createdTo;
    queryParams.CreatedTo = params.createdTo;
  }
  if (params.sessionDateFrom) {
    queryParams.sessionDateFrom = params.sessionDateFrom;
    queryParams.SessionDateFrom = params.sessionDateFrom;
  }
  if (params.sessionDateTo) {
    queryParams.sessionDateTo = params.sessionDateTo;
    queryParams.SessionDateTo = params.sessionDateTo;
  }

  return queryParams;
}

function parsePaginatedResponse(
  response: unknown,
  defaultPageSize = 10,
  defaultPageNumber = 1,
): PaginatedList<OrderListItem> {
  let items: OrderListItem[] = [];
  let totalCount = 0;

  if (Array.isArray(response)) {
    items = response as OrderListItem[];
    totalCount = items.length;
  } else if (response && typeof response === "object") {
    const resObj = response as Record<string, unknown>;
    const val = resObj.value;
    if (Array.isArray(val)) {
      items = val as OrderListItem[];
      totalCount = items.length;
    } else if (val && typeof val === "object") {
      const valObj = val as Record<string, unknown>;
      items =
        (valObj.items as OrderListItem[]) ||
        (Array.isArray(valObj) ? (valObj as OrderListItem[]) : []);
      totalCount = (valObj.totalCount as number) || items.length;
    } else if (resObj.items && Array.isArray(resObj.items)) {
      items = resObj.items as OrderListItem[];
      totalCount = (resObj.totalCount as number) || items.length;
    }
  }

  return {
    items,
    totalCount,
    pageNumber: defaultPageNumber,
    pageSize: defaultPageSize,
    totalPages: Math.ceil(totalCount / defaultPageSize) || 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

export const orderService = {
  getMyOrders: async (params?: GetOrdersParams): Promise<PaginatedList<OrderListItem>> => {
    const queryParams = buildOrderQueryParams(params);
    const response = await apiClient.get<unknown>(API_ENDPOINTS.ORDER.LIST, {
      params: queryParams,
    });
    return parsePaginatedResponse(response, params?.pageSize || 10, params?.pageNumber || 1);
  },

  getAll: async (params?: GetOrdersParams): Promise<PaginatedList<OrderListItem>> => {
    const queryParams = buildOrderQueryParams(params);
    const response = await apiClient.get<unknown>(API_ENDPOINTS.ORDER.LIST, {
      params: queryParams,
    });
    return parsePaginatedResponse(response, params?.pageSize || 10, params?.pageNumber || 1);
  },

  getOrderById: async (id: string): Promise<OrderDetail> => {
    try {
      const response = (await apiClient.get<unknown>(
        API_ENDPOINTS.ORDER.GET(id),
      )) as unknown as Record<string, unknown>;
      const data = (response?.value || response) as OrderDetail;
      if (data && (data.id || data.items)) return data;
      throw new Error("Invalid detail response");
    } catch {
      const response = (await apiClient.get<unknown>(
        API_ENDPOINTS.ORDER.MANAGER_GET(id),
      )) as unknown as Record<string, unknown>;
      return (response?.value || response) as OrderDetail;
    }
  },

  createOrder: async (sessionId: string, cartVersion: number): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<ApiResponse<CreateOrderResponse>>(
      API_ENDPOINTS.ORDER.CREATE,
      { sessionId, cartVersion },
    );
    return (response as unknown as ApiResponse<CreateOrderResponse>).value;
  },

  deleteOrder: async (id: string) => {
    const response = (await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.ORDER.DELETE(id),
    )) as unknown as ApiResponse<{ message: string }>;
    return response?.value;
  },

  confirmReceived: async (orderId: string) => {
    try {
      const response = (await apiClient.post<ApiResponse<{ message: string }>>(
        API_ENDPOINTS.PICKUP.COLLECT,
        { orderId },
      )) as unknown as ApiResponse<{ message: string }>;
      return response?.value;
    } catch {
      try {
        const response = (await apiClient.post<ApiResponse<{ message: string }>>(
          `/api/Orders/${orderId}/confirm`,
        )) as unknown as ApiResponse<{ message: string }>;
        return response?.value;
      } catch {
        const response = (await apiClient.put<
          ApiResponse<{ id: string; status: number; message: string }>
        >(API_ENDPOINTS.ORDER.UPDATE(orderId), {
          id: orderId,
          status: 2,
        })) as unknown as ApiResponse<{ id: string; status: number; message: string }>;
        return response?.value;
      }
    }
  },

  updateOrderStatus: async (orderId: string, status: number, note?: string) => {
    try {
      const response = (await apiClient.put<ApiResponse<{ message: string }>>(
        API_ENDPOINTS.ORDER.MANAGER_UPDATE_STATUS(orderId),
        { id: orderId, status },
      )) as unknown as ApiResponse<{ message: string }>;
      return response?.value;
    } catch {
      try {
        const response = (await apiClient.put<ApiResponse<{ message: string }>>(
          API_ENDPOINTS.ORDER.UPDATE(orderId),
          { id: orderId, status, ...(note && { note }) },
        )) as unknown as ApiResponse<{ message: string }>;
        return response?.value;
      } catch {
        if (status === 3) {
          const response = (await apiClient.delete<ApiResponse<{ message: string }>>(
            API_ENDPOINTS.ORDER.DELETE(orderId),
          )) as unknown as ApiResponse<{ message: string }>;
          return response?.value;
        }
        throw new Error("Could not update order status");
      }
    }
  },

  getManagerOrdersBySession: async (
    sessionId: string,
    params?: GetOrdersParams,
  ): Promise<PaginatedList<OrderListItem>> => {
    const queryParams = buildOrderQueryParams(params);
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ORDER.MANAGER_BY_SESSION(sessionId),
      { params: queryParams },
    );
    return parsePaginatedResponse(response, params?.pageSize || 10, params?.pageNumber || 1);
  },

  getManagerOrderById: async (id: string): Promise<OrderDetail> => {
    try {
      const response = (await apiClient.get<unknown>(
        API_ENDPOINTS.ORDER.MANAGER_GET(id),
      )) as unknown as Record<string, unknown>;
      const data = (response?.value || response) as OrderDetail;
      if (data && (data.id || data.items)) return data;
      throw new Error("Invalid detail response");
    } catch {
      const response = (await apiClient.get<unknown>(
        API_ENDPOINTS.ORDER.GET(id),
      )) as unknown as Record<string, unknown>;
      return (response?.value || response) as OrderDetail;
    }
  },

  updateManagerOrderStatus: async (orderId: string, status: number) => {
    const response = (await apiClient.put<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.ORDER.MANAGER_UPDATE_STATUS(orderId),
      { id: orderId, status },
    )) as unknown as ApiResponse<{ message: string }>;
    return response?.value;
  },

  getOrderEvents: async (
    orderId: string,
    type?: string,
  ): Promise<{
    orderId: string;
    count: number;
    events: ServingJobEvent[];
  }> => {
    try {
      const params = type ? { type } : undefined;
      const response = (await apiClient.get<unknown>(API_ENDPOINTS.ORDER.MANAGER_EVENTS(orderId), {
        params,
      })) as unknown as Record<string, unknown>;

      const val = (response?.value || response) as {
        orderId?: string;
        count?: number;
        events?: ServingJobEvent[];
      };

      return {
        orderId: val?.orderId || orderId,
        count: val?.count || val?.events?.length || 0,
        events: val?.events || [],
      };
    } catch (err) {
      console.warn(
        `[orderService.getOrderEvents] Endpoint ${API_ENDPOINTS.ORDER.MANAGER_EVENTS(orderId)} returned error (404/not deployed yet):`,
        err,
      );
      return {
        orderId,
        count: 0,
        events: [],
      };
    }
  },
};
