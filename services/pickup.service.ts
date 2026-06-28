import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";

export const pickupService = {
  assign: async (data: {
    orderId: string;
    slotCode?: string;
    trayCode?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = (await apiClient.post<ApiResponse<{ message: string }>>(
        API_ENDPOINTS.PICKUP.ASSIGN,
        data,
      )) as unknown as ApiResponse<{ message: string }>;
      return response;
    } catch (error) {
      console.error("Error assigning pickup slot:", error);
      throw error;
    }
  },

  collect: async (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = (await apiClient.post<ApiResponse<{ message: string }>>(
        API_ENDPOINTS.PICKUP.COLLECT,
        { orderId },
      )) as unknown as ApiResponse<{ message: string }>;
      return response;
    } catch (error) {
      console.error("Error collecting order:", error);
      throw error;
    }
  },
};
