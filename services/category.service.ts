import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Category } from "@/types/category.types";
import type { PaginatedList, ApiResponse } from "./session.service";

export const categoryService = {
  getAll: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Category>> => {
    try {
      const response = (await apiClient.get<ApiResponse<PaginatedList<Category>>>(
        API_ENDPOINTS.CATEGORY.LIST,
        {
          params: {
            pageSize: 100,
            ...params,
          },
        },
      )) as unknown as ApiResponse<PaginatedList<Category>>;

      return response.value;
    } catch (error) {
      console.error("Lỗi khi tải danh sách Categories:", error);
      throw error;
    }
  },
};
