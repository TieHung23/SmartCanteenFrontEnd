import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiResponse, PaginatedList } from "./session.service";
import type { LogListItem, LogDetail, LogFilterParams } from "@/types/log.types";

export const logService = {
  getLogs: async (params?: LogFilterParams): Promise<PaginatedList<LogListItem>> => {
    try {
      const response = (await apiClient.get<ApiResponse<PaginatedList<LogListItem>>>(
        API_ENDPOINTS.ADMIN.LOGS.LIST,
        { params },
      )) as unknown as ApiResponse<PaginatedList<LogListItem>>;

      return response.value;
    } catch (error) {
      console.error("Error when fetching logs:", error);
      throw error;
    }
  },

  getLogDetail: async (id: string): Promise<LogDetail> => {
    try {
      const response = (await apiClient.get<ApiResponse<LogDetail>>(
        API_ENDPOINTS.ADMIN.LOGS.GET(id),
      )) as unknown as ApiResponse<LogDetail>;

      return response.value;
    } catch (error) {
      console.error(`Error when fetching log detail ID ${id}:`, error);
      throw error;
    }
  },
};
