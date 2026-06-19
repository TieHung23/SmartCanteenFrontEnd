import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Dish } from "@/types/dish.types";
import { type ApiResponse, type PaginatedList } from "./session.service";

export const dishService = {
  getDishes: async (params?: {
    categoryId?: string;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Dish>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedList<Dish>>>(
        API_ENDPOINTS.DISH.LIST,
        {
          params,
        },
      );

      const checkResponse = response as unknown as {
        value?: PaginatedList<Dish>;
        data?: { value?: PaginatedList<Dish> };
      };

      if (checkResponse && checkResponse.value) {
        return checkResponse.value;
      }

      if (checkResponse && checkResponse.data && checkResponse.data.value) {
        return checkResponse.data.value;
      }

      const fallbackData = (response as unknown as { data?: PaginatedList<Dish> }).data || response;
      return fallbackData as PaginatedList<Dish>;
    } catch (error) {
      console.error("Error listing dishes in dishService:", error);
      throw error;
    }
  },
};
