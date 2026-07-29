import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";
import type {
  ShelfStock,
  ShelfStockDetail,
  ShelfStockListResponse,
  CreateShelfStockPayload,
  UpdateShelfStockPayload,
} from "@/types/shelf-stock.types";

export const shelfStockService = {
  getById: async (id: string): Promise<ShelfStockDetail> => {
    const response = (await apiClient.get<ApiResponse<ShelfStockDetail>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.GET(id),
    )) as unknown as ApiResponse<ShelfStockDetail>;
    return response.value;
  },

  getBySession: async (sessionId: string): Promise<ShelfStock[]> => {
    const response = (await apiClient.get<ApiResponse<ShelfStockListResponse>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.LIST_BY_SESSION(sessionId),
    )) as unknown as ApiResponse<ShelfStockListResponse>;
    return response.value.stocks;
  },

  getByArm: async (armId: string): Promise<ShelfStock[]> => {
    const response = (await apiClient.get<ApiResponse<ShelfStockListResponse>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.LIST_BY_ARM(armId),
    )) as unknown as ApiResponse<ShelfStockListResponse>;
    return response.value.stocks;
  },

  getByDish: async (dishId: string): Promise<ShelfStock[]> => {
    const response = (await apiClient.get<ApiResponse<ShelfStockListResponse>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.LIST_BY_DISH(dishId),
    )) as unknown as ApiResponse<ShelfStockListResponse>;
    return response.value.stocks;
  },

  create: async (data: CreateShelfStockPayload): Promise<ShelfStock> => {
    const response = (await apiClient.post<ApiResponse<ShelfStock>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.CREATE,
      data,
    )) as unknown as ApiResponse<ShelfStock>;
    return response.value;
  },

  update: async (id: string, data: UpdateShelfStockPayload): Promise<ShelfStock> => {
    const response = (await apiClient.put<ApiResponse<ShelfStock>>(
      API_ENDPOINTS.MANAGER.SHELF_STOCKS.UPDATE(id),
      data,
    )) as unknown as ApiResponse<ShelfStock>;
    return response.value;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.MANAGER.SHELF_STOCKS.DELETE(id));
  },
};
