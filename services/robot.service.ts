import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse } from "./session.service";

export const robotService = {
  createServingJob: async (data: {
    orderId: string;
    trayId?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = (await apiClient.post<ApiResponse<{ message: string }>>(
        API_ENDPOINTS.ROBOT.SERVING_JOBS,
        data,
      )) as unknown as ApiResponse<{ message: string }>;
      return response;
    } catch (error) {
      console.error("Error creating robot serving job:", error);
      throw error;
    }
  },
};
