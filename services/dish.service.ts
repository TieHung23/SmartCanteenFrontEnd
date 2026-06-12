import apiClient from "@/lib/api/client";
import type { Dish } from "@/types/dish.types";
import { type ApiResponse, type PaginatedList } from "./meal.service";

export const dishService = {
  getDishes: async (params?: {
    categoryId?: string;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedList<Dish>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedList<Dish>>>("/api/dishes", {
        params,
      });

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
